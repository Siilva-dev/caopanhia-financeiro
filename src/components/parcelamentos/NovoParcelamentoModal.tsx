import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useBankAccounts, useCreateInstallment, useUpdateInstallment } from "@/hooks/useSupabaseData";

const formSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valorTotal: z.number().min(0.01, "Valor total deve ser maior que 0"),
  numeroParcelas: z.number().min(1, "Número de parcelas deve ser maior que 0"),
  valorParcela: z.number().min(0.01, "Valor da parcela deve ser maior que 0"),
  status: z.enum(["Em andamento", "Concluído", "Pendente"]),
  proximaData: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  formaPagamento: z.enum(["Cartão", "Boleto", "Pix"]),
  contaAssociada: z.string().min(1, "Conta associada é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

interface NovoParcelamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  selectedParcelamento?: any;
}

export function NovoParcelamentoModal({
  open,
  onOpenChange,
  onSubmit,
  selectedParcelamento,
}: NovoParcelamentoModalProps) {
  const { data: bankAccounts = [] } = useBankAccounts();
  const createInstallment = useCreateInstallment();
  const updateInstallment = useUpdateInstallment();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valorTotal: 0,
      numeroParcelas: 1,
      valorParcela: 0,
      status: "Em andamento",
      formaPagamento: "Cartão",
      contaAssociada: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    const installmentData = {
      description: data.descricao,
      total_amount: data.valorTotal,
      installments_count: data.numeroParcelas,
      installment_amount: data.valorParcela,
      start_date: format(data.proximaData, "yyyy-MM-dd"),
      payment_method: data.formaPagamento,
      associated_account: data.contaAssociada,
      next_due_date: format(data.proximaData, "yyyy-MM-dd"),
      status: data.status,
    };

    if (selectedParcelamento) {
      updateInstallment.mutate({
        id: selectedParcelamento.id,
        ...installmentData,
      });
    } else {
      createInstallment.mutate(installmentData);
    }
    
    form.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Atualizar o formulário quando selectedParcelamento mudar
  useEffect(() => {
    if (selectedParcelamento && open) {
      // Ensure date is properly converted
      let validDate = new Date();
      if (selectedParcelamento.next_due_date || selectedParcelamento.start_date) {
        const dateValue = new Date(selectedParcelamento.next_due_date || selectedParcelamento.start_date);
        if (!isNaN(dateValue.getTime())) {
          validDate = dateValue;
        }
      }
      
      form.reset({
        descricao: selectedParcelamento.description || "",
        valorTotal: selectedParcelamento.total_amount || 0,
        numeroParcelas: selectedParcelamento.installments_count || 1,
        valorParcela: selectedParcelamento.installment_amount || 0,
        status: selectedParcelamento.status || "Em andamento",
        proximaData: validDate,
        formaPagamento: selectedParcelamento.payment_method || "Cartão",
        contaAssociada: selectedParcelamento.associated_account || "",
      });
    } else if (open && !selectedParcelamento) {
      form.reset({
        descricao: "",
        valorTotal: 0,
        numeroParcelas: 1,
        valorParcela: 0,
        status: "Em andamento",
        formaPagamento: "Cartão",
        contaAssociada: "",
      });
    }
  }, [selectedParcelamento, open, form]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedParcelamento ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
          <DialogDescription>
            {selectedParcelamento ? "Atualize os dados do parcelamento abaixo." : "Preencha os dados do parcelamento abaixo."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Parcelamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Notebook Dell, iPhone 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valorTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroParcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valorParcela"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Parcela (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Parcelamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma" />
                        </SelectTrigger>
                      </FormControl>
                    <SelectContent>
                      <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                      <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="Pix">PIX</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proximaData"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento da Próxima Parcela</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value && !isNaN(new Date(field.value).getTime()) ? (
                            format(new Date(field.value), "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contaAssociada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Associada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.name}>
                          {account.name} - {account.type || 'Conta Digital'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-white">
                Salvar Parcelamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}