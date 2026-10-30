# Clinical source documents

The only permitted basis for triage rules (spec section 5.2). Rules cite document and section; thresholds are never taken from memory or blogs.

**Received 2026-10-30.** The PDFs are kept locally and are **git-ignored** (`docs/sources/*.pdf`): they are third-party copyrighted documents. The files supplied are named `National Guidelines for Clinical Management of Dengue Fever 2023.pdf`, `9789241547871_eng.pdf` (WHO 2009) and `20240521_342849-B_PRESS_READY_PocketGuideDCMC_UPDATE.pdf` (the "Dengue Case Management" pocket guide; publisher still to be confirmed, TODO C-003).

| File (suggested name)                       | Document                                                                                                                         | Status  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `ncvbdc-dengue-clinical-guidelines-2023.pdf` | National Guidelines for Clinical Management of Dengue Fever 2023, NCVBDC, MoHFW, Government of India (ncvbdc.mohfw.gov.in)     | received |
| `who-dengue-guidelines-2009.pdf`            | WHO, Dengue: guidelines for diagnosis, treatment, prevention and control (2009), plus any current WHO updates                    | received |
| `20240521_342849-B_PRESS_READY_PocketGuideDCMC_UPDATE.pdf` | "Dengue Case Management" pocket guide (cited as `CDC_POCKET`). The spec asked for CDC "Clinical Care of Dengue"; the supplied file's text does not name its publisher, so it is treated as the CDC document only provisionally | received, publisher unconfirmed |

Notes:

- These are third-party copyrighted documents: do not commit them to a public repository without checking their licence. The PDFs are git-ignored until the repository is confirmed private.
- Do not paste long passages from them into the repo. Summarise in our own words and cite document + section number.
