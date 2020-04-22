import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
	width: 100%;
	height: auto;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	padding: 1.45rem;
	margin-bottom: 3.45rem;
`

const Image = styled.img`
	width: initial;
	box-shadow: 0 2px 30px -15px var(--shadow, rgba(0, 0, 0, 0.8));
`

const ArticleImage = ({ src, alt }) => {
	return (
		<Wrapper className="article-image">
			<Image src={src} alt={alt} />
		</Wrapper>
	)
}

export default ArticleImage
