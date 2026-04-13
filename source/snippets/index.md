---
title: 代码片段
type: "snippets"
---

{% for snippet in site.data.snippets.snippets %}
<div class="snippet-card">
  <div class="snippet-header">
    <span class="snippet-category">{{ snippet.category }}</span>
    <h3>{{ snippet.title }}</h3>
  </div>
  
  <p class="snippet-desc">{{ snippet.description }}</p>
  
  <div class="snippet-code">
    <pre><code class="language-{{ snippet.category | downcase }}">{{ snippet.code }}</code></pre>
  </div>
</div>
{% endfor %}