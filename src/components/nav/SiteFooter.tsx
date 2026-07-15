/**
 * Мелкий служебный футер под колонкой рекомендаций — как в вебе Instagram.
 * Пункты не ведут никуда: соответствующих страниц у клона нет, а мёртвые ссылки хуже
 * простого текста. Поэтому это подписи, а не <a> — визуально то же самое.
 */
const FOOTER_LINKS = [
  "Meta",
  "Информация",
  "Блог",
  "Вакансии",
  "Помощь",
  "API",
  "Конфиденциальность",
  "Условия",
  "Места",
  "Популярное",
  "Язык",
  "Meta Verified",
];

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-4 text-[11px] leading-4 text-muted-foreground/70">
      <ul className="flex flex-wrap gap-x-1 gap-y-1">
        {FOOTER_LINKS.map((label, index) => (
          <li key={label}>
            {label}
            {index < FOOTER_LINKS.length - 1 && <span aria-hidden="true"> ·</span>}
          </li>
        ))}
      </ul>
      <p className="uppercase">© {new Date().getFullYear()} Instagram from Meta</p>
    </footer>
  );
}
