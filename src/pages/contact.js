import React from 'react'
import { Link } from 'gatsby'
import { useStaticQuery, graphql } from 'gatsby'
import styled from 'styled-components'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Banner from '../components/Banner'
import Form from '../components/Form'

const Contact = () => {
	return (
		<Layout>
			<SEO title="Contact" />
			<Banner
				title={`Contact`}
				subtitle={`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}
			/>
			<Form />
		</Layout>
	)
}

export default Contact
