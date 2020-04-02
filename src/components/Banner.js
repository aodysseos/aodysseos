import React from 'react'
import styled from 'styled-components'

import Heading from './Heading'

const Wrapper = styled.div`margin-top: 76px;`

const Banner = ({ title, subtitle }) => (
	<Wrapper>
		<Heading heading={1} variant={`primary`}>
			{title}
		</Heading>
		<Heading heading={2} variant={`primary`}>
			{subtitle}
		</Heading>
	</Wrapper>
)

export default Banner
