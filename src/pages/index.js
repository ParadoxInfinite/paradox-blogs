import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import Button from "../components/button"

class IndexPage extends React.Component {
  render() {
    const siteTitle = "Paradox Blogs"

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title="Home"
          keywords={[`blog`, `gatsby`, `javascript`, `react`]}
        />
        <h1>
          Hey people{" "}
          <span role="img" aria-label="wave emoji">
            👋
          </span>
        </h1>
        <p>This is my attempt at writing a blog site while learning Gatsby + Netlify.</p>
        <p>
          The blog will mainly consist of guides, tutorials and articles about my finidings and adventures.
        </p>
        <p>Hopefully you will find this interesting and enjoy the read!</p>
        <Link to="/blog/">
          <Button marginTop="35px">Go to Blog ➡</Button>
        </Link>
      </Layout>
    )
  }
}

export default IndexPage
