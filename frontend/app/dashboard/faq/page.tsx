import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Часті запитання</h2>
        <p className="text-muted-foreground mt-2">Знайдіть відповіді на популярні запитання про роботу платформи.</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>Як працює "Безпечна угода"?</AccordionTrigger>
          <AccordionContent>
            Кошти замовника заморожуються на рахунку платформи до моменту, поки виконавець не здасть роботу, а замовник її не підтвердить. Це гарантує безпеку для обох сторін.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Яка комісія сервісу?</AccordionTrigger>
          <AccordionContent>
            Комісія сервісу становить 15% від суми замовлення. Вона сплачується замовником при підтвердженні виконавця.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Як вивести кошти?</AccordionTrigger>
          <AccordionContent>
            Ви можете подати заявку на вивід коштів у розділі "Баланс". Кошти зараховуються на карту протягом 1-3 робочих днів.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>Що робити, якщо робота виконана неякісно?</AccordionTrigger>
          <AccordionContent>
            Ви можете відправити роботу на доопрацювання або відкрити спір (Арбітраж). Наш менеджер розгляне ситуацію і прийме справедливе рішення.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}