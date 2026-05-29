// ============ 指定回复 ============
const SCRIPT_VAR = { type: 'script' };
const DEFAULT_CONTENT = '严格参考已有的信息||请更改要输入的情节||严格参照剧情描述经过,合理扩展完善剧情||详细描述具体行为的过程.不限于动作语言神态，多于7000字#指导||剧情||要求||注意';

insertVariables({ joezhangynDirectReplyContent: DEFAULT_CONTENT }, SCRIPT_VAR);

const event_type = getButtonEvent('指定回复');
const event_type1 = getButtonEvent('继续');

eventOn(event_type, async () => {
  const savedContent = getVariables(SCRIPT_VAR).joezhangynDirectReplyContent ?? DEFAULT_CONTENT;

  const input_text = await SillyTavern.callGenericPopup(
    `输入格式：内容1||内容2||内容n#标签1||标签2||标签n`,
    SillyTavern.POPUP_TYPE.INPUT,
    savedContent,
    {
      wide: true,
      onClose: async (popup) => {
        const textarea = popup.dlg.querySelector('textarea');
        if (textarea) {
          insertOrAssignVariables({ joezhangynDirectReplyContent: textarea.value }, SCRIPT_VAR);
        }
      },
    },
  );

  if (input_text === false) return;

  const processedInput = input_text.trim() || savedContent;
  const [contentPart, tagNamesPart] = processedInput.split('#').map(p => p.trim());
  const contentParts = contentPart ? contentPart.split('||').map(p => p.trim()).filter(Boolean) : [];
  const tagNames = tagNamesPart ? tagNamesPart.split('||').map(p => p.trim()).filter(Boolean) : [];
  const finalTags = tagNames.length > 0 ? tagNames : ['指导', '剧情', '要求'];

  const formattedContent = finalTags.map((tag, i) => {
    let value = contentParts[i];
    if (value === undefined) {
      if (tag === '指导') value = '严格参考已有的信息';
      else if (tag === '要求') value = '合理发展描述剧情';
      else value = '';
    }
    return `<${tag}>${value}</${tag}>`;
  }).join('');

  triggerSlash(`/send {GLOBAL:${formattedContent}} || /trigger ||`);
});

eventOn(event_type1, () => {
  triggerSlash(`/send {继续上一场景} || /trigger ||`);
});

eventOn(tavern_events.GENERATION_STARTED, () => {
  insertOrAssignVariables({ joezhangynDirectReplyContent: DEFAULT_CONTENT }, SCRIPT_VAR);
});