/**
 * Bio component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React from "react"
import { StaticQuery, graphql } from "gatsby"
import styled from "styled-components"


function Bio() {
  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { author, alias, social } = data.site.siteMetadata
        const { github, twitter } = data.site.siteMetadata.iconStrings
        return (
          <Container>
            <p>
              Written by <strong>{author}</strong> aka <strong>{alias}</strong>,
              a cybersecurity enthusiast and a computer science nerd.
              <br />
              <a href={`https://github.com/${social.github}`}>
                <img src={github} alt="GitHub" width="20" height="20" /> Find interesting code on my GitHub
              </a>
              <br />
              <a href={`https://twitter.com/${social.twitter}`}>
                <img src={twitter} alt="Twitter" width="20" height="20" /> Checkout my boring Twitter account
              </a>
            </p>
          </Container>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    avatar: file(absolutePath: { regex: "/gatsby-icon.png/" }) {
      childImageSharp {
        fixed(width: 50, height: 50) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        alias
        social {
          twitter
          github
        }
        iconStrings {
          github
          twitter
        }
      }
    }
  }
`

const Container = styled.div`
  display: flex;
`

export default Bio
