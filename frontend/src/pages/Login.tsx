import { Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";

export default function Login() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
    // hmmmm
  function handleLogin() {
    window.location.href = `${backendUrl}/api/auth/login`;
  }

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minHeight="100vh"
      width="100vw"
      bg="gray.100"
    >
      <VStack gap="1.2rem">
        <Heading textStyle="4xl">Wolves of Cloudstreet</Heading>
        <Text textStyle="lg" color="gray.600">
          Start tracking stock & crypto sentiment
        </Text>
        <Button size="lg" onClick={handleLogin}>
          Login / Sign Up
        </Button>
      </VStack>
    </Flex>
  );
}
