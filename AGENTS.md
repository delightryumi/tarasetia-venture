<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `skills/antislop/SKILL.md`
- UI / visual: `skills/antislop-ui/SKILL.md`
- People & Accessibility: `skills/antislop-human/SKILL.md`
- Copy & Text: `skills/antislop-copywriting/SKILL.md`
- Mobile & Responsive Layout: `skills/antislop-layoutmobile/SKILL.md`
- Code Comments Hygiene: `skills/antislop-code/SKILL.md`

Before starting any UI work, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

## Aturan Eksekusi Perintah & DOM (Wajib Dipatuhi)
1. **Dilarang Menjalankan DOM / Browser Subagent Tanpa Permintaan:**
   - Jangan menjalankan browser, manipulasi DOM, atau subagent browser apapun kecuali diminta secara eksplisit oleh user.
2. **Dilarang Menjalankan PNPM / Terminal Command Apapun Tanpa Permintaan:**
   - Jangan menjalankan `pnpm` (`pnpm dev`, `pnpm run`, `pnpm install`, dll.) atau script server/terminal apapun jika user tidak memintanya.
   - Jika ada command yang dirasa perlu dijalankan, **tanyakan dan minta konfirmasi user terlebih dahulu** sebelum menjalankannya.
