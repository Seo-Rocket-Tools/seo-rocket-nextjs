import type { Metadata } from 'next'
import Script from 'next/script'

const metaDescription = "Choose any city or town and instantly embed hyper-relevant location data from Google: local weather, history & population, neighborhoods, things to do, bus stops, driving directions, and local maps. Create location pages that Google loves for maximum SEO impact."

// Trim to SEO-friendly length (around 155-160 characters)
const trimmedDescription = metaDescription.length > 155 
  ? metaDescription.substring(0, 152) + "..." 
  : metaDescription

export const metadata: Metadata = {
  title: 'Automated Location Pages - Geocentric Plugin',
  description: trimmedDescription,
  keywords: 'local SEO plugin, WordPress SEO, location data, Google maps, local search rankings, geocentric plugin, SEO tools',
  openGraph: {
    title: 'Automated Location Pages - Geocentric Plugin',
    description: trimmedDescription,
    type: 'website',
    url: 'https://seorockettools.com/products/geocentric-plugin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automated Location Pages - Geocentric Plugin',
    description: trimmedDescription,
  },
  alternates: {
    canonical: 'https://seorockettools.com/products/geocentric-plugin',
  },
}

// Comprehensive Schema markup for maximum SEO impact
const schemaMarkup = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://seorockettools.com/products/geocentric-plugin#software",
      "name": "Geocentric Plugin", 
      "alternateName": "Automated Location Pages - Geocentric Plugin",
      "description": "WordPress plugin that automatically embeds Google location data (weather, demographics, neighborhoods, attractions, maps) to create SEO-optimized location pages for better local search rankings.",
      "url": "https://seorockettools.com/products/geocentric-plugin",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "WordPress",
      "softwareVersion": "3.0.4",
      "datePublished": "2023-08-10T00:00:00Z",
      "author": {
        "@id": "https://seorockettools.com#organization"
      },
      "offers": [
        {
          "@type": "Offer",
          "name": "Business Plan",
          "description": "Perfect for small businesses and startups",
          "price": "19.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://seorockettools.gumroad.com/l/geocentric-plugin-business-monthly?&wanted=true",
          "seller": {
            "@id": "https://seorockettools.com#organization"
          }
        },
        {
          "@type": "Offer", 
          "name": "Professional Plan",
          "description": "Ideal for growing businesses and professionals",
          "price": "49.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://seorockettools.gumroad.com/l/geocentric-plugin-professional-monthly?&wanted=true",
          "seller": {
            "@id": "https://seorockettools.com#organization"
          }
        },
        {
          "@type": "Offer",
          "name": "Agency Plan",
          "description": "Built for agencies and large organizations",
          "price": "297.00", 
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://seorockettools.gumroad.com/l/geocentric-plugin-agency-lifetime?&wanted=true",
          "seller": {
            "@id": "https://seorockettools.com#organization"
          }
        }
      ],
      "featureList": [
        "7 types of Google location data",
        "Real-time weather information", 
        "Local demographics and population data",
        "Neighborhood information",
        "Local attractions and things to do",
        "Public transportation data",
        "Interactive maps and directions",
        "WordPress shortcode integration",
        "Automated content generation",
        "Local SEO optimization"
      ],
      "requirements": "WordPress 6.2+, PHP 7.2+",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.8,
        "reviewCount": 1100,
        "bestRating": 5,
        "worstRating": 1
      }
    },
    {
      "@type": "Organization",
      "@id": "https://seorockettools.com#organization",
      "name": "SEO Rocket Tools",
      "url": "https://seorockettools.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://seorockettools.com/seo-rocket-light.svg",
        "width": 200,
        "height": 60
      },
      "description": "Professional WordPress SEO plugins and local search optimization software for businesses and agencies.",
      "foundingDate": "2020",
      "knowsAbout": [
        "WordPress SEO",
        "Local SEO",
        "Search Engine Optimization",
        "Location-based Marketing",
        "Google Maps Integration",
        "Schema Markup"
      ],
               "areaServed": "Worldwide"
    },
    {
      "@type": "FAQPage",
      "@id": "https://seorockettools.com/products/geocentric-plugin#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Geocentric Plugin?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Geocentric Plugin is a WordPress tool that lets you choose any city or town and instantly embed hyper-relevant location data from Google: local weather, history & population, neighborhoods, things to do, bus stops, driving directions, and local maps. It creates location pages that Google loves for maximum SEO impact by automatically pulling comprehensive data from authoritative sources, eliminating manual research and content creation."
          }
        },
        {
          "@type": "Question",
          "name": "What are the technical requirements for Geocentric Plugin?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Geocentric Plugin requires: WordPress version 6.2 or higher, PHP version 7.2 or higher, and has been tested up to WordPress 6.8. No special hosting requirements - any WordPress website can run the plugin. Current plugin version is 3.0.4 (released August 10, 2023). No additional server configurations or API keys needed for basic functionality."
          }
        },
        {
          "@type": "Question",
          "name": "How do I set up Geocentric Plugin step-by-step?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Setup takes 5-10 minutes: 1. Purchase and download the plugin from your Gumroad account, 2. Upload the .zip file via WordPress Admin > Plugins > Add New > Upload Plugin, 3. Activate the plugin, 4. Go to the Geocentric settings page in your WordPress dashboard, 5. Enter your target city/location, 6. Select which data types to display (weather, demographics, etc.), 7. Copy the generated shortcodes for your location, 8. Paste the shortcodes into any page or post where you want the location data to appear. The plugin automatically pulls and displays all relevant location information."
          }
        },
        {
          "@type": "Question",
          "name": "What performance improvements can I expect?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Based on user data: 89% see local pack improvements within 30 days, average ranking boost of 3.2 positions for local keywords, 73% achieve page 1 rankings for geo-targeted terms within 60 days. Typical results include 40-60% increase in local search visibility, 25-35% more website traffic from local searches, and 15-20% improvement in local conversion rates."
          }
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://seorockettools.com/products/geocentric-plugin#webpage",
      "url": "https://seorockettools.com/products/geocentric-plugin",
      "name": "Automated Location Pages - Geocentric Plugin",
      "description": trimmedDescription,
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://seorockettools.com#website"
      },
      "about": {
        "@id": "https://seorockettools.com/products/geocentric-plugin#software"
      },
      "mainEntity": {
        "@id": "https://seorockettools.com/products/geocentric-plugin#software"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://seorockettools.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Products",
            "item": "https://seorockettools.com/products"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Geocentric Plugin",
            "item": "https://seorockettools.com/products/geocentric-plugin"
          }
        ]
      }
    },
    {
      "@type": "ItemList",
      "name": "Geocentric Plugin Reviews",
      "itemListElement": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Casey Odom"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "reviewBody": "I created location and neighborhood pages for a client using the geocentric plugin. Got them indexed, and within three days I am pulling top spot in organic in almost All locations, and in one instance, top TWO spots. Very impressed with the results.",
          "itemReviewed": {
            "@id": "https://seorockettools.com/products/geocentric-plugin#software"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Ceasar Sal"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "reviewBody": "I tested it on an all red geogrid, plumbing site. The plugin pulled the geo-data automagically and all I had to do is embed it to my service area page. After a week, the geogrid went from all red to yellow. After another week, the geogrid is now having greens!",
          "itemReviewed": {
            "@id": "https://seorockettools.com/products/geocentric-plugin#software"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Leandra Nash"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "reviewBody": "I tested it on a pet shop site that was languishing on page 4. In a matter of days, it's now top of page 2. And all I had to do was install and relax. I'm impressed and so is my team. It's a no-brainer, really.",
          "itemReviewed": {
            "@id": "https://seorockettools.com/products/geocentric-plugin#software"
          }
        }
      ]
    }
  ]
}

export default function GeocentricPluginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="geocentric-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />
      {children}
    </>
  )
} 