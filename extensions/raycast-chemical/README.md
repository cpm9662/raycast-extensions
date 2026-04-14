# Chemical Catalog Search

Search chemical catalog results from Daejung chemicals(대정화금), Samchun chemicals(삼전순약), and Sigma-Aldrich directly inside Raycast.

No additional setup is required. Install the extension and start searching by chemical name or CAS number.

## Commands

- `Search Chemicals`: Search Daejung, Samchun, and Sigma-Aldrich in one command.
- `Search Samchun`: Search only Samchun.
- `Search Daejung`: Search only Daejung.
- `Search Sigma-Aldrich`: Search only Sigma-Aldrich.

## What It Does

- Search by English chemical name or CAS number.
- Compare matching products across supported suppliers in one list.
- Open supplier pages in the browser for product details or ordering.
- Copy CAS numbers and catalog or product codes from the action panel.

## Notes

- Search results depend on the availability and structure of each supplier website.
- Samchun links open the supplier search page because direct product detail links are not consistently exposed in search results.
- Sigma-Aldrich results are grouped by product number and show normalized shipping availability such as `Today` or `YYYY-MM-dd`.
- Prices, stock labels, and pack sizes come from the supplier pages and may change without notice.

## Preferences

- `Title Max Length`: Truncates long product names in the list.
- `Show Grade`: Adds reagent grade information to the subtitle when available.
- `Show Catalog Number`: Shows supplier catalog or product identifiers in the accessory columns.

## Supported Suppliers

- DAEJUNG Chemicals & Metals / 대정화금(주)
- SAMCHUN Chemicals / 삼전순약공업(주)
- Sigma-Aldrich
