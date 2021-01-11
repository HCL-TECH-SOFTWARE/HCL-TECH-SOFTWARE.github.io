/*!
 * Copyright HCL 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const axios = require('axios');
const fs = require("fs-extra");
const yaml = require("js-yaml");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG = process.env.ORG;
let json = [];
let topicJson = {};
let jsonPublic = [];

/**
 * Query GitHub with GraphQL and process the results into JSON objects.
 * The function recursively calling itself if not last page of repository results
 * 
 * @param {*} count number of repositories to return
 * @param {*} startCursor repository cursor at which to start returning repositories
 */
const processQuery = async(count, startCursor) => {
  try {
    let resp = await doQuery(count, startCursor);
    var nodes = resp.data.data.organization.repositories.nodes;
    for (var i = 0; i < nodes.length; i++) {
      var repo = nodes[i];
      var obj = {};
      obj.name = repo.name;
      obj.description = (repo.description) ? repo.description : '';
      obj.url = repo.url;
      obj.private = repo.isPrivate;
      obj.fork = repo.isFork;
      obj.license = (repo.licenseInfo) ? repo.licenseInfo.name : '';
      obj.language = (repo.primaryLanguage) ? repo.primaryLanguage.name : '';
      var topics = [];
      for (var j = 0; j < repo.repositoryTopics.nodes.length; j++) {
        var topic = repo.repositoryTopics.nodes[j].topic.name;
        topics.push(topic);
        if (topicJson[topic]) {
          topicJson[topic].repositories[obj.name] = obj;
        } else {
          topicJson[topic] = {};
          topicJson[topic].name = topic;
          topicJson[topic].repositories = {};
          topicJson[topic].repositories[obj.name] = obj;
        }
      }
      obj.topics = topics;
      json.push(obj);
      if (!obj.private) {
        jsonPublic.push(obj);
      }
    }
    var nextPage = resp.data.data.organization.repositories.pageInfo.hasNextPage;
    var newStartCursor = resp.data.data.organization.repositories.pageInfo.endCursor;
    if (nextPage) {
      await processQuery(count, newStartCursor);
    }
    return json;
  } catch (error) {
    console.error(error);
  }
}

// Main code
if (!GITHUB_TOKEN) {
  console.log("No GitHub token supplied, quitting...");
  return;
} else {
  writeToFile();
}
/**
 * Main async function to process the GraphQL query and write them to files in this repo.
 */
async function writeToFile() {
  await processQuery(10);
  //console.log(json);
  fs.writeJSON('../_data/repoData.json', json, {spaces: '\t'}, err => {
    if (err) return console.error(err)
  });
  //fs.writeFile('../_data/repoData.yaml', yaml.dump(json));
  fs.writeJSON('../_data/repoTopics.json', topicJson, {spaces: '\t'}, err => {
    if (err) return console.error(err)
  });
  //fs.writeFile('../_data/repoTopics.yaml', yaml.dump(topicJson));
  fs.writeJSON('../_data/repoDataPublic.json', jsonPublic, {spaces: '\t'}, err => {
    if (err) return console.error(err)
  });
  //fs.writeFile('../_data/repoDataPublic.yaml', yaml.dump(jsonPublic));
}

/**
 * Async function to perform an axios request to GitHub.
 * **NOTE** Hard-coded to return only 10 (TEN) topics
 * 
 * @param {*} count number of repositories to return
 * @param {*} startCursor repository cursor at which to start returning repositories
 */
async function doQuery(count, startCursor) {
    var filter = `first: ${count}`;
    if (startCursor) {
      filter += `, after: "${startCursor}"`;
    }
    let query = `{
      organization(login: "${ORG}") {
        repositories(${filter}) {
          nodes {
            name
            description
            isPrivate
            isFork
            url
            licenseInfo {
              name
            }
            primaryLanguage {
              name
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
            hasPreviousPage
            startCursor
          }
        }
      }
    }`;
    //console.log(query);
    let config = {
      method: 'post',
      url: 'https://api.github.com/graphql',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`
      },
      data: {
        "query": query
      }
    }
    try {
      response = await axios.request(config);
      if (response.data.errors) {
        throw Error(JSON.stringify(response.data.errors));
      }
      //console.log(response.data);
      return response;
    } catch (error) {
      throw Error(error);
    }
}