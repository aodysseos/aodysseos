import React from "react";

const ArticleTemplate = ({ pageContext: { article } }) => (
  <article>
    <h1>{article.title}</h1>
  </article>
);

export default ArticleTemplate;
