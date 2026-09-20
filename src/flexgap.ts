/**
 * Flex gap 布局行为检测（Chrome 61 基线回退方案，见 minitool css-compatibility）。
 * 语法检测（@supports / CSS.supports）无法证明 Flex gap 真正生效，
 * 必须实际创建 Flex 容器测量一次；通过后给 <html> 加 supports-flex-gap，
 * 对应的 margin 基线回退（构建期追加在 CSS 末尾）随之失效。
 */
(function detectFlexGap() {
  function supportsFlexGap(): boolean {
    const flex = document.createElement('div');
    flex.style.position = 'absolute';
    flex.style.visibility = 'hidden';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.rowGap = '1px';
    flex.appendChild(document.createElement('div'));
    flex.appendChild(document.createElement('div'));
    document.body.appendChild(flex);
    const supported = flex.scrollHeight === 1;
    flex.parentNode!.removeChild(flex);
    return supported;
  }
  try {
    if (supportsFlexGap()) {
      document.documentElement.classList.add('supports-flex-gap');
    }
  } catch {
    /* 检测失败则保持 margin 基线 */
  }
})();
