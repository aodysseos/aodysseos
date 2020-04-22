import React from 'react'
import Gist from 'react-gist'
import _ from 'lodash'
import styled from 'styled-components'
import { MARKS, BLOCKS, INLINES } from '@contentful/rich-text-types'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import { getAssetType, getAssetSrc, getAssetTitle } from './helpers'

import Heading from '../../components/Heading'
import Paragraph from '../../components/Paragraph'

import Image from '../../components/Article/ArticleImage'

const Video = styled.video`max-width: 100%;`

const ExternalLink = styled.a`
	position: relative;
	color: ${(props) => props.theme.primary};
	&::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		height: 1px;
		width: 100%;
		background-color: ${(props) => props.theme.primary};
	}
`

const IframeContainer = styled.div`
	position: relative;
	padding-bottom: 47.25%;
	height: 0;
	overflow: hidden;
	width: 100%;
	height: 100%;
	& iframe {
		width: 100%;
		height: 500px;
		border: 0;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
	}
`

const Img = ({ children, alt }) => <Image src={children} alt={alt} />

const Codesandbox = ({ title, uri }) => (
	<IframeContainer>
		<iframe
			src={uri}
			title={title}
			allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	</IframeContainer>
)

const getHyperlinkObject = (hyperlinkNode) => {
	const hyperlinkOptions = {
		gist: 'https://gist.github.com',
		codesandbox: 'https://codesandbox.io/embed/'
	}

	const title = _.get(hyperlinkNode, 'content.0.value', '')
	const uri = _.get(hyperlinkNode, 'data.uri')
	const isGithub = uri.startsWith(hyperlinkOptions.gist)
	const isCodeSandbox = uri.startsWith(hyperlinkOptions.codesandbox)

	if (isGithub) {
		return {
			title,
			type: 'gist',
			id: _.split(uri, /^((http[s]):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.js)/)[6]
		}
	} else if (isCodeSandbox) {
		return {
			title,
			type: 'codesandbox',
			uri
		}
	} else {
		return { title, type: 'hyperlink', uri }
	}
}

const getAssetObject = (assetNode, children) => {
	const assetObject = _.get(assetNode, 'data.target')
	const [ assetType ] = getAssetType(assetObject).split('/')

	switch (assetType) {
		case 'gist':
			return <Gist />
		case 'codesandbox':
			return <Codesandbox {..._.get(assetObject, 'fields')} />
		default:
			return children
	}
}

const options = {
	renderMark: {
		[MARKS.BOLD]: (text) => <b key={`${text}-key`}>{text}</b>,
		[MARKS.ITALIC]: (text) => <div>{text}</div>,
		[MARKS.UNDERLINE]: (text) => <div>{text}</div>,
		[MARKS.CODE]: (text) => (
			<SyntaxHighlighter language="javascript" style={a11yLight} wrapLines>
				{text}
			</SyntaxHighlighter>
		)
	},
	renderNode: {
		[BLOCKS.HEADING_3]: (node, children) => (
			<Heading heading={3} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_4]: (node, children) => (
			<Heading heading={4} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_5]: (node, children) => (
			<Heading heading={5} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.HEADING_6]: (node, children) => (
			<Heading heading={6} variant={'primary'}>
				{children}
			</Heading>
		),
		[BLOCKS.PARAGRAPH]: (node, children) => (
			<Paragraph paragraph={1} variant={'primary'}>
				{children}
			</Paragraph>
		),
		[BLOCKS.EMBEDDED_ENTRY]: (node, children) => {
			return getAssetObject(node, children)
		},
		'embedded-asset-block': (node, children) => {
			const [ assetType ] = getAssetType(node.data.target).split('/')
			if (assetType === 'video') {
				return <Video assetType={getAssetType(node.data.target)}>{getAssetSrc(node.data.target)}</Video>
			}
			if (assetType === 'image') {
				return <Img alt={getAssetTitle(node.data.target)}>{getAssetSrc(node.data.target)}</Img>
			}
		},
		[INLINES.HYPERLINK]: (node, children) => {
			const hyperlinkObj = getHyperlinkObject(node)
			switch (hyperlinkObj.type) {
				case 'gist':
					return <Gist {...hyperlinkObj} />
				case 'codesandbox':
					return <Codesandbox {...hyperlinkObj} />
				default:
					return (
						<ExternalLink target="_blank" href={hyperlinkObj.uri}>
							{hyperlinkObj.title}
						</ExternalLink>
					)
			}
		}
	}
}

export default options
