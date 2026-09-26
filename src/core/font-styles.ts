/** Font rules are large for CJK scripts; fetch only the reader's script. */
export async function loadFontStyles(code: string): Promise<void> {
  if (code === "ja") await import("./fonts/japanese");
  else if (code === "zh-CN") await import("./fonts/chinese");
  else if (code === "ar") await import("./fonts/arabic");
}
