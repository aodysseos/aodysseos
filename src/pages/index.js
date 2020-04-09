import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'

import Cube from '../components/cube'

const IndexPage = () => (
	<Layout page="Home">
		<SEO title="Home" />
		<Cube />
	</Layout>
)

export default IndexPage
