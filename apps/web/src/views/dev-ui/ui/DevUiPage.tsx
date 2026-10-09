"use client";

import { devUi as t } from "@umnyaut/catalog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  ChoiceTileGroup,
  categoryIcons,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  formatDimensions,
  formatMoney,
  formatNumber,
  formatQuantity,
  IconCircle,
  type LengthUnit,
  Logo,
  Mascot,
  MaterialThumb,
  NumberField,
  PresetChips,
  Segment,
  Select,
  Sheet,
  SheetContent,
  SheetTrigger,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  toast,
  UnitToggle,
} from "@umnyaut/ui";
import { Layers, Package, Share2, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { mascotImages, materialImages } from "@/shared/config";

const COLORS = [
  "bg",
  "surface",
  "surface-sunken",
  "surface-mint",
  "border",
  "border-input",
  "text",
  "text-muted",
  "text-subtle",
  "primary",
  "primary-hover",
  "primary-soft",
  "accent",
  "accent-soft",
  "accent-text",
  "danger",
  "danger-soft",
] as const;

const pack = { one: "пачка", few: "пачки", many: "пачек" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-border border-t py-8">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

function Gallery() {
  const [length, setLength] = useState<number | null>(4.6);
  const [width, setWidth] = useState<number | null>(null);
  const [unit, setUnit] = useState<LengthUnit>("m");
  const [doors, setDoors] = useState(1);
  const [roomType, setRoomType] = useState<string>("living");
  const [laying, setLaying] = useState<string>("straight");
  const [shape, setShape] = useState<string>("rect");
  const [preset, setPreset] = useState<string | null>("room");

  return (
    <>
      <Section title={t.sections.type}>
        <p className="text-display">{t.sample.display}</p>
        <p className="text-h1">{t.sample.h1}</p>
        <p className="text-h2">{t.sample.h2}</p>
        <p className="text-h3">{t.sample.h3}</p>
        <p className="text-body">{t.sample.body}</p>
        <p className="text-body-strong">{t.sample.body}</p>
        <p className="text-small text-text-muted">{t.sample.small}</p>
        <p className="text-caption text-text-muted">{t.sample.caption}</p>
        <p className="flex items-baseline gap-2">
          <span className="text-result">{t.sample.result}</span>
          <span className="text-result-unit">{t.sample.resultUnit}</span>
          <span className="ml-6 text-quantity">{t.sample.quantity}</span>
        </p>
      </Section>

      <Section title={t.sections.colors}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {COLORS.map((name) => (
            <li key={name} className="overflow-hidden rounded-md border border-border">
              <span className="block h-12" style={{ background: `var(--color-${name})` }} />
              <code className="block px-2 py-1 text-caption">{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.sections.buttons}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg">
            {t.buttons.calculate}
          </Button>
          <Button size="lg">{t.buttons.save}</Button>
          <Button>{t.buttons.copy}</Button>
          <Button variant="secondary">{t.buttons.more}</Button>
          <Button variant="ghost" size="sm">
            {t.buttons.more}
          </Button>
          <Button variant="danger">
            <Trash2 aria-hidden="true" />
            {t.buttons.remove}
          </Button>
          <Button loading>{t.buttons.saving}</Button>
          <Button variant="secondary" size="icon" aria-label={t.buttons.share}>
            <Share2 aria-hidden="true" />
          </Button>
          <Button disabled>{t.buttons.save}</Button>
        </div>
      </Section>

      <Section title={t.sections.fields}>
        <div className="flex items-center justify-between">
          <span className="text-small text-text-muted">{t.fields.units}</span>
          <UnitToggle
            value={unit}
            onValueChange={setUnit}
            labels={{ m: t.fields.unitM, cm: t.fields.unitCm }}
            label={t.fields.units}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label={t.fields.length}
            unit={unit === "m" ? t.fields.unitM : t.fields.unitCm}
            value={length}
            onValueChange={setLength}
            min={0.5}
            max={30}
            required
            hint={t.fields.hint}
            messages={{ range: t.fields.range, required: t.fields.required }}
          />
          <NumberField
            label={t.fields.width}
            unit={unit === "m" ? t.fields.unitM : t.fields.unitCm}
            value={width}
            onValueChange={setWidth}
            min={0.5}
            max={30}
            required
            messages={{ range: t.fields.range, required: t.fields.required }}
          />
          <Select label={t.fields.roomType} options={t.roomTypes} value={roomType} onValueChange={setRoomType} />
          <Stepper
            label={t.fields.doors}
            value={doors}
            onValueChange={setDoors}
            min={0}
            max={6}
            decrementLabel={t.fields.less}
            incrementLabel={t.fields.more}
            className="self-end"
          />
        </div>
      </Section>

      <Section title={t.sections.choice}>
        <PresetChips chips={t.presets.chips} value={preset} onValueChange={setPreset} label={t.presets.label} />
        <Segment options={t.laying.options} value={laying} onValueChange={setLaying} label={t.laying.label} />
        <ChoiceTileGroup
          label={t.shape.label}
          value={shape}
          onValueChange={setShape}
          options={t.shape.options.map((option) => ({
            ...option,
            media:
              option.value === "rect" ? <categoryIcons.osnova aria-hidden="true" /> : <Layers aria-hidden="true" />,
          }))}
        />
      </Section>

      <Section title={t.sections.disclosure}>
        <Card padding="none" className="px-4">
          <Accordion type="single" collapsible defaultValue="how">
            {t.accordion.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger>{item.title}</AccordionTrigger>
                <AccordionContent>{item.text}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
        <Tabs defaultValue="list">
          <TabsList>
            {t.tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {t.tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="text-body text-text-muted">
              {tab.text}
            </TabsContent>
          ))}
        </Tabs>
      </Section>

      <Section title={t.sections.overlays}>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">{t.overlays.openDialog}</Button>
            </DialogTrigger>
            <DialogContent
              title={t.overlays.dialogTitle}
              description={t.overlays.dialogText}
              closeLabel={t.overlays.close}
            >
              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button variant="secondary">{t.overlays.cancel}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger">{t.buttons.remove}</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">{t.overlays.openSheet}</Button>
            </SheetTrigger>
            <SheetContent title={t.overlays.sheetTitle}>
              <Stepper
                label={t.fields.doors}
                value={doors}
                onValueChange={setDoors}
                decrementLabel={t.fields.less}
                incrementLabel={t.fields.more}
              />
            </SheetContent>
          </Sheet>
          <Button variant="secondary" onClick={() => toast(t.overlays.toastText)}>
            {t.overlays.toast}
          </Button>
        </div>
      </Section>

      <Section title={t.sections.media}>
        <div className="flex flex-wrap items-center gap-6">
          <Logo />
          <span className="rounded-md bg-brand-navy p-3">
            <Logo tone="white" />
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <Mascot image={mascotImages.hello} size={160} alt={t.media.mascotHello} spot />
          <Mascot image={mascotImages.done} size={96} alt="" spot />
          <Mascot image={mascotImages.warn} size={96} alt="" />
          <Mascot image={mascotImages.oops} size={160} alt="" spot />
          <Mascot image={mascotImages.head} size={40} alt="" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(categoryIcons).map(([slug, Icon]) => (
            <IconCircle key={slug}>
              <Icon />
            </IconCircle>
          ))}
          <MaterialThumb fallbackIcon={<Package />} alt={t.media.noPhoto} />
          {Object.entries(materialImages).map(([key, image]) => (
            <MaterialThumb
              key={key}
              image={image}
              fallbackIcon={<Package />}
              alt={t.media.materials[key as keyof typeof materialImages]}
            />
          ))}
          <MaterialThumb image={materialImages.laminate} fallbackIcon={<Package />} alt="" size={56} />
          <MaterialThumb image={materialImages.wallpaper} fallbackIcon={<Package />} alt="" size={96} />
        </div>
      </Section>

      <Section title={t.sections.format}>
        <ul className="grid gap-1 text-body tabular-nums">
          <li>{formatNumber(12460)}</li>
          <li>{formatNumber(19.8)}</li>
          <li>{formatMoney(12460, "RU")}</li>
          <li>{formatMoney(8500, "KZ")}</li>
          <li>{formatMoney(45, "BY")}</li>
          <li>{formatMoney(1200, "KG")}</li>
          <li>
            {formatQuantity(1, pack)} · {formatQuantity(3, pack)} · {formatQuantity(10, pack)}
          </li>
          <li>{formatDimensions([4.6, 4.3, 2.7], "м")}</li>
        </ul>
      </Section>
    </>
  );
}

/** Internal component gallery (P3.11). Check at 390 and 1440 px. */
export function DevUiPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-h1">{t.title}</h1>
      <p className="mt-2 text-body text-text-muted">{t.lead}</p>
      <Gallery />
      <section data-theme="dark" className="mt-8 rounded-xl bg-bg p-4 text-text lg:p-8">
        <h2 className="text-h2">{t.sections.dark}</h2>
        <Gallery />
      </section>
      <Toaster />
    </main>
  );
}
