import { pxToRem } from 'styled-media-query'

// all measurements are to rem units.
const vars = {
	mainWidth: { sm: 0, md: 0, lg: 1440 },
	headerWidth: { sm: 65, md: 65, lg: 65 },
	gap: pxToRem(
		{
			mobile: '32px',
			tablet: '48px',
			desktop: '0px'
		},
		16
	),
	sideWidth: pxToRem(
		{
			mobile: '0px',
			tablet: '0px',
			desktop: '105px'
		},
		16
	),
	breakpointsPx: {
		mobile: 250,
		tablet: 768,
		desktop: 1200
	},
	breakpoints: pxToRem(
		{
			mobile: '250px',
			tablet: '768px',
			desktop: '1200px'
		},
		16
	)
}
export default vars
