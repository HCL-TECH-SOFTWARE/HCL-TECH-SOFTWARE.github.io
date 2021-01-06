---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: default
---
{::options parse_block_html="true" /}

### Introduction
HCL Nomad brings Domino applications to mobile devices leveraging traditional Domino development skills for the rich client. Desktop client applications can be used without any additional changes in HCL Nomad. But it's worth bearing in mind some differences, and coding accordingly:
- The majority of desktops use a mouse or keyboard shortcuts to navigate. Mobile devices do not, and so pixel-precise access to an application is not possible.
- The screen size and resolution are different. This can have a big impact on usability.
- The screen size and resolution may differ from mobile device to mobile device. This may have an impact on what is exposed.
- The use cases for mobile use are not the same as desktop. On desktop users may live within an application throughout most of the day. On a mobile device that is not the case. On mobile users want to open an app, do their work and move on.
- Application admin functions will typically be done in the office. Do these realy need to exposed on mobile devices?
- Distributed rather than server-only use may require different architectural approaches, to avoid replication / save conflicts.

Although the development skills required are often the same, a specific mobile UI may be preferable.

### The starting point

My important paragraph.
{: .alert .alert-info}

<div class="panel panel-info">
**Note**
{: .panel-heading}
<div class="panel-body">

NOTE DESCRIPTION

</div>
</div>

<div class="panel panel-warning">
**Note**
{: .panel-heading}
<div class="panel-body">

NOTE DESCRIPTION

</div>
</div>

<div class="panel panel-danger">
**Note**
{: .panel-heading}
<div class="panel-body">

NOTE DESCRIPTION

</div>
</div>

<div class="panel panel-success">
**Note**
{: .panel-heading}
<div class="panel-body">

Do you think there's a gotcha here

</div>
</div>


<div class="panel panel-success">
**Note**
{: .panel-heading}
<div class="panel-body">

Do you think there's a gotcha here

</div>
</div>
{: .why #why1}

<br/>

You could have gone wrong!
{: .troubleshoot #trouble1}

<br/>

Try something a little more advanced
{: .advanced #advanced1}

<br/>

{% raw %}
~~~xml
	<!-- rgb(29,181,54) -->
	<xp:div style="font-size:32px;color:#1db536; border: 1px solid black; padding: 4px">
		<i class="fas fa-check-circle" style="padding-right: 5px"></i>
		Completed
	</xp:div>

	<xp:br></xp:br>
    <xp:br></xp:br>
~~~
{: .code}
{% endraw %}

<br/>