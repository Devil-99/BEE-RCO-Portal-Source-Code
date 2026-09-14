import { useState, useEffect, useRef } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import deloitte_theme from "../../theme";
import { useSelector } from "react-redux";
import { showToast } from "../../components/toastService";

import {
  useCreateTicketMutation,
  useGetCategoriesQuery,
  useGetSubcategoriesQuery,
} from "../../redux/apiSlices/helpdesk/helpdeskApi";

export default function CreateTicket() {
  const [form, setForm] = useState({
    user_id: "",
    category: "",
    subcategory: "",
    title: "",
    description: "",
    priority: "Medium",
  });

  const { username } = useSelector((state) => state.login);
  const navigate = useNavigate();

  const lastHandledRequestRef = useRef(null);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: subcategories = [] } = useGetSubcategoriesQuery(
    form.category,
    { skip: !form.category }
  );

  const [
    createTicket,
    { isLoading, isSuccess, isError, error, requestId },
  ] = useCreateTicketMutation();

  useEffect(() => {
    if (username) {
      setForm((prev) => ({
        ...prev,
        user_id: username,
      }));
    }
  }, [username]);

  const handleCategoryChange = (categoryId) => {
    const id = Number(categoryId);

    setForm((prev) => ({
      ...prev,
      category: id,
      subcategory: "",
      title: "",
      description: "",
    }));
  };


  const handleSubcategoryChange = (subcategoryId) => {
    const selected = subcategories.find(
      (sub) => sub.id.toString() === subcategoryId
    );

    setForm((prev) => ({
      ...prev,
      subcategory: subcategoryId,
      title: selected?.description || "",
      description: "",
    }));
  };


  const handleSubmit = async () => {
    if (isLoading) return;

    if (!form.category || !form.subcategory || !form.title) {
      showToast({
        title: "Please fill all mandatory fields",
        status: "warning",
      });
      return;
    }

    try {
      await createTicket(form).unwrap();
    } catch (error) {
      console.error("Failed to create ticket", error);
    } finally {
      setForm({
        user_id: "",
        category: "",
        subcategory: "",
        title: "",
        description: "",
        priority: "Medium",
      })
    }
  };

  return (
    <Flex
      direction="column"
      gap={deloitte_theme.gap}
    >
      <Box
        bg={deloitte_theme.white}
        borderRadius="lg"
        p={deloitte_theme.paddingY}
        border="1px solid"
        borderColor={deloitte_theme.bordercolor}
      >
        <Flex direction="column" gap={6}>
          <Heading size="md" color={deloitte_theme.primaryColor}>
            Create Helpdesk Ticket
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl isRequired>
              <FormLabel>User Name</FormLabel>
              <Input
                value={form.user_id}
                onChange={(e) =>
                  setForm({ ...form, user_id: e.target.value })
                }
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                placeholder="Select category"
                value={form.category}
                onChange={(e) =>
                  handleCategoryChange(e.target.value)
                }
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Sub Category</FormLabel>
              <Select
                placeholder="Select sub category"
                value={form.subcategory}
                isDisabled={!form.category}
                onChange={(e) =>
                  handleSubcategoryChange(e.target.value)
                }
              >
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />
            </FormControl>

            <FormControl gridColumn="1 / -1">
              <FormLabel>Description</FormLabel>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel>Priority</FormLabel>
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value,
                  })
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </Select>
            </FormControl>
          </SimpleGrid>

          <Flex justify="flex-end">
            <Button
              bg={deloitte_theme.buttonPrimary}
              color="white"
              onClick={handleSubmit}
              isLoading={isLoading}
              isDisabled={isLoading}
            >
              Submit Ticket
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
}