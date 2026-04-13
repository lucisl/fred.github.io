---
title: 项目作品
type: "projects"
---

{% for project in site.data.projects.projects %}
<div class="project-card">
  <h3>{{ project.name }}</h3>
  <p>{{ project.desc }}</p>
  
  <div class="project-tech">
    {% for tech in project.tech %}
    <span class="tech-tag">{{ tech }}</span>
    {% endfor %}
  </div>
  
  {% if project.highlights %}
  <ul class="project-highlights">
    {% for highlight in project.highlights %}
    <li>{{ highlight }}</li>
    {% endfor %}
  </ul>
  {% endif %}
  
  <div class="project-links">
    {% if project.link %}
    <a href="{{ project.link }}" target="_blank">GitHub →</a>
    {% endif %}
    {% if project.demo %}
    <a href="{{ project.demo }}" target="_blank">Demo →</a>
    {% endif %}
  </div>
</div>
{% endfor %}