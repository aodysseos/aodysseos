import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/Layout'
import SEO from '../components/Seo'

import Cube from '../components/Cube'

const IndexPage = () => (
	<Layout page="Home">
		<SEO title="Home" />
		<Cube />
	</Layout>
)

export default IndexPage
