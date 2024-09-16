import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const LinkSchema = z.object({
  name: z.string().min(1, { message: "リンク名を入力してください。" }),
  url: z.string().url({ message: "有効なURLを入力してください。" }),
});

const FormSchema = z.object({
  links: z.array(LinkSchema).refine(
    (links) => links.length === 0 || links.every(link => link.name && link.url),
    {
      message: "全てのリンクにリンク名とURLを入力するか、全て削除してください。",
    }
  ),
});

interface EditLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: { name: string; url: string }[];
  onSave: (links: { name: string; url: string }[]) => void;
}

const EditLinksModal: React.FC<EditLinksModalProps> = ({ isOpen, onClose, links, onSave }) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      links: links.length > 0 ? links : [{ name: '', url: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  useEffect(() => {
    form.reset({ links: links.length > 0 ? links : [{ name: '', url: '' }] });
  }, [links, form]);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const validLinks = data.links.filter(link => link.name && link.url);
    onSave(validLinks);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>関連リンクを編集</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                <FormField
                  control={form.control}
                  name={`links.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">リンク名</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`links.${index}.url`}
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">URL</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mt-6 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', url: '' })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              リンクを追加
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLinksModal;