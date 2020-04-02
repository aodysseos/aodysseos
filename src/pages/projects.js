import React from 'react'
import { Link } from 'gatsby'
import { useStaticQuery, graphql } from 'gatsby'
import styled from 'styled-components'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Banner from '../components/Banner'

const Projects = () => {
	return (
		<Layout>
			<SEO title="Projects" />
			<Banner title={`Projects`} subtitle={`I write about Web development, Javascript, opinion and more.`} />
		</Layout>
	)
}

export default Projects
