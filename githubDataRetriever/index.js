/**
 * Copyright 2021 HCL Software
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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
const processQuery = async (count, startCursor) => {
  try {
    let resp = await doQuery(count, startCursor);
    var nodes = resp.data.data.organization.repositories.nodes;
    for (var i = 0; i < nodes.length; i++) {
      var repo = nodes[i];
      if (!repo.isPrivate) {
        var obj = {};
        obj.name = repo.name;
        obj.description = (repo.description) ? repo.description : '';
        obj.url = repo.url;
        obj.private = repo.isPrivate;
        obj.fork = repo.isFork;
        obj.license = (repo.licenseInfo) ? repo.licenseInfo.name : '';
        obj.language = (repo.primaryLanguage) ? repo.primaryLanguage.name : 'Not Identified';
        obj.languageColor = getLangColor(obj.language);
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
            topicJson[topic].availableTopics = {};
          }
          if (repo.isFork) {
            topicJson[topic].availableTopics["fork"] = {};
            topicJson[topic].availableTopics["fork"].name = "fork";
          }
          for (var k = 0; k < repo.repositoryTopics.nodes.length; k++) {
            var subTopic = repo.repositoryTopics.nodes[k].topic.name;
            if (topic != subTopic && !topicJson[topic].availableTopics[subTopic]) {
              topicJson[topic].availableTopics[subTopic] = {};
              topicJson[topic].availableTopics[subTopic].name = subTopic;
            }
          }
        }
        obj.topics = topics;
        json.push(obj);
        if (!obj.private) {
          jsonPublic.push(obj);
        }
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

function getLangColor(lang) {
  switch (lang) {
    case "C++":
      return "#f34b7d";
    case "JavaScript":
      return "#f1e05a";
    case "TypeScript":
      return "#2b7489";
    case "HTML":
      return "#e34c26";
    case "CSS":
      return "#563d7c";
    case "Python":
      return "#3572A5";
    case "Xtend":
      return "#ccc";
    case "Java":
      return "#b07219";
    case "C":
      return "#555555";
    case "C#":
      return "#178600";
    case "Jupyter Notebook":
      return "#DA5B0B";
    case "Go":
      return "#00ADD8";
    case "Shell":
      return "#89e051";
    case "PHP":
      return "#4F5D95";
    case "Ruby":
      return "#701516";
    case "Go":
      return "#375eab";
    case "Perl":
      return "#0298c3";
    case "Swift":
      return "#ffac45";
    case "Objective-C":
      return "#438eff";
    case "Groovy":
      return "#e69f56";
    case "Scala":
      return "#c22d40";
    case "WebAssembly":
      return "#04133b";
    case "Rust":
      return "#dea584";
    case "Jinja":
      return "#a52a22";
    default:
      return "#fff";
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
  fs.writeJSON('../_data/repoData.json', json, { spaces: '\t' }, err => {
    if (err) return console.error(err)
  });
  fs.writeJSON('../_data/repoTopics.json', topicJson, { spaces: '\t' }, err => {
    if (err) return console.error(err)
  });
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