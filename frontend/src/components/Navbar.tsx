import type { User } from '@/types/user'
import { Box, Button, Flex, Heading, HStack, Spacer, Text } from '@chakra-ui/react'
import React from 'react'

type NavbarProps = {
  user: User | null;
  handleLogout: () => void;
};

// "as" overwrites default tag
// spacer goated
export default function Navbar({user, handleLogout}: NavbarProps) {
  return (
    <Flex as="nav" p="1rem" alignItems="center">
      <Heading as="h1">Wovles of Cloudstreet</Heading>
      <Spacer></Spacer> 
      <HStack gap="1rem">
        {/* <Box bg="gray.200" p="1rem">avatar placeholder</Box> */}
        <Text>{user?.email ?? 'Not Logged In'}</Text>
          {!user ? (
            <> </>
            ) :
              <Button onClick={handleLogout}>Logout</Button>
          }
      </HStack>
    </Flex>
  )
}
