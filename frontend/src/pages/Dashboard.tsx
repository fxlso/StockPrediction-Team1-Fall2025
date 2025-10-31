import { getNewsArticles, type ArticleWithTickers } from '@/api/article_api';
import type { User } from '@/types/user'
import type { NewsArticle } from '../../../src/db/schema.ts'
//  src/db/schema.ts'
import React, { useEffect, useState } from 'react'
import { Badge, Box, Container, Heading, Link, Table, Text } from '@chakra-ui/react';



type DashboardProps = {
  user: User | null;
}

export default function Dashboard( { user }: DashboardProps) {

    // const [isLoading, setIsLoading] = useState(true)
    const [articles, setArticles] = useState<ArticleWithTickers[]>([])
    useEffect(() => {
        loadArticles()
    }, [])

    async function loadArticles() {
        // setIsLoading(true)
        const data = await getNewsArticles();
        console.log("articles loading...", data)
        setArticles(data)
        // setIsLoading(false)
    }

    // if (isLoading) {
    //     return (
    //     <Container maxW="container.xl" py={8}>
    //         <Text>Loading articles...</Text>
    //     </Container>
    //     )
    // }

  return (
        <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>News Articles</Heading>

      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
        <Table.Root>
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader>Title</Table.ColumnHeader>
              <Table.ColumnHeader>Tickers</Table.ColumnHeader>
              <Table.ColumnHeader>Sentiment</Table.ColumnHeader>
              <Table.ColumnHeader>Score</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {articles.map((article) => (
              <Table.Row key={article.articleId}>
                <Table.Cell>
                  <Link href={article.url} color="blue.600">
                    {article.title}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {article.tickers.map((ticker) => (
                      <Badge key={ticker.tickerId}>
                        {ticker.symbol}
                      </Badge>
                    ))}
                  </Box>
                </Table.Cell>
                <Table.Cell>
                  <Badge 
                    colorScheme={
                      article.overallSentimentLabel === 'bullish' ? 'green' :
                      article.overallSentimentLabel === 'bearish' ? 'red' : 'gray'
                    }
                  >
                    {article.overallSentimentLabel}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {article.overallSentimentScore }
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Container>
  )
}
