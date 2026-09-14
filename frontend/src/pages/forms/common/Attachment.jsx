import { Box, Heading, Grid, Link } from "@chakra-ui/react";
import FileUpload from "./FileUpload";

export default function AttachmentsBlock({ allFiles, setAllFiles, uploadedPaths }) {
  return (
    <Box bg="white" p={5} borderRadius="xl">
      <Heading fontSize="lg" mb={4} borderBottomWidth="1px" pb={2}>
        Attachments
      </Heading>

      <FileUpload files={allFiles} setFiles={setAllFiles} />

      {uploadedPaths?.length > 0 && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mt={3}>
          {uploadedPaths.map((p, i) => {
            const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(p);
            const isPdf = /\.pdf$/i.test(p);
            return (
              <Box key={i} border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
                {isImage ? (
                  <img src={p} alt={p} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                ) : isPdf ? (
                  <embed src={p} type="application/pdf" width="100%" height="150px" />
                ) : (
                  <Link href={p} isExternal color="blue.600">
                    {p}
                  </Link>
                )}
              </Box>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
