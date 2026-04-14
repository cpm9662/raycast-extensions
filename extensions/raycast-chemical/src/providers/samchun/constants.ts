export const SAMCHUN_BASE_URL = "http://www.samchun.com";
export const SAMCHUN_SEARCH_ENDPOINT_URL = `${SAMCHUN_BASE_URL}/kr/sub/product/list.asp`;
export const SAMCHUN_DIVISION = "A";

export function buildSamchunSearchUrl(keyword: string): string {
  const params = new URLSearchParams({
    s_keyword: keyword,
    s_division: SAMCHUN_DIVISION,
  });

  return `${SAMCHUN_SEARCH_ENDPOINT_URL}?${params.toString()}`;
}
