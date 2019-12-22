import React from "react";
import { Link } from "gatsby";
import PropTypes from "prop-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

import SEO from "./seo";

const Article = ({ title, main }) => (
  <div>
    <SEO title="Article" />
    <h1>{title}</h1>
    {documentToReactComponents(main.json)}
    <Link to="/blog">Go back to the Blog</Link>
  </div>
);

export default Article;
