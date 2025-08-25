import { Button, FocusModal, Heading, Input, Label, toast } from "@medusajs/ui";
import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk.js";
import { HttpTypes } from "@medusajs/framework/types";

const CreateBrand = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { mutateAsync: CreateBrand, isPending: isCreating } = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      await sdk.client.fetch("/admin/brands", {
        method: "POST",
        body: data,
      });
    },
  });

  const handleCreate = async () => {
    try {
      await CreateBrand({
        name,
      });
      setOpen(false);
      toast.success("Brand created successfully");
      queryClient.invalidateQueries({
        queryKey: ["brands"],
      });
      setName("");
    } catch (error) {
      toast.error("Failed to create brand");
    }
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Trigger asChild>
        <Button variant="primary">Create</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            <Heading level={"h1"}>Create Brand</Heading>
          </div>
        </FocusModal.Header>
        <FocusModal.Body>
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div>
                <div className="mb-1">
                  <Label className>Brand Name</Label>
                </div>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={isCreating}
            >
              Create Brand
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

export default CreateBrand;
