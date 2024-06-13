import React from 'react'
import { Link } from 'gatsby'
import { useStaticQuery, graphql } from 'gatsby'
import styled from 'styled-components'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Banner from '../components/Banner'

const About = () => {
	return (
		<Layout>
			<SEO title="About" />
			<Banner
				title={`About`}
				subtitle={``}
			/>
		</Layout>
	)
}

export default About
