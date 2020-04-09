import React from 'react'
import { Link } from 'gatsby'
import { useStaticQuery, graphql } from 'gatsby'
import styled from 'styled-components'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Banner from '../components/banner'
import Form from '../components/form'

const Contact = () => {
	return (
		<Layout>
			<SEO title="Contact" />
			<Banner title={`Contact`} subtitle={`I write about Web development, Javascript, opinion and more.`} />
			<Form />
		</Layout>
	)
}

export default Contact
