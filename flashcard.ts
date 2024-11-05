import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import katex from "katex"



function resolveInternalLinks(content: string): string {
  // 匹配 [[链接]] 格式
  return content.replace(/\[\[(.*?)\]\]/g, (match, link) => {
    const [text, alias] = link.split('|')
    const url = text.trim().replace(/\s+/g, '-').toLowerCase()
    return `<a href="/${url}">${alias || text}</a>`
  })
}

function renderContent(content: string): string {
  // 将换行符转换为 <br> 标签，但保护 LaTeX 内容
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    return match.replace(/\n/g, ' ');
  });
  content = content.replace(/\$(.*?)\$/g, (match) => {
    return match.replace(/\n/g, ' ');
  });
  content = content.replace(/\n/g, '<br>')
  
  // 渲染 LaTeX
  content = renderLatex(content)
  
  // 处理图片，支持缩放
  content = content.replace(/!\[(.*?)\|(\d+)\]\((.*?)\)/g, (match, alt, size, src) => {
    return `<img src="${src}" alt="${alt}" style="width: ${size}px; height: auto;">`
  });
  // 理没有指定大小的图片
  content = content.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
  
  content = resolveInternalLinks(content)
  
  // 将内容包裹在一个 div 中，以便更好地控制布局
  return `<div class="flashcard-content">${content}</div>`
}

function renderLatex(content: string): string {
  return content.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true })
    } catch (e) {
      console.error('KaTeX 错误:', e)
      return match
    }
  }).replace(/\$(.*?)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: false })
    } catch (e) {
      console.error('KaTeX 错误:', e)
      return match
    }
  })
}

export const Flashcard: QuartzTransformerPlugin = () => {
  return {
    name: "Flashcard",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          visit(tree, "code", (node) => {
            if (node.lang === "flashcard") {
              const [front, back] = node.value.split("---").map(s => s.trim())
              const htmlContent = `
                <div class="flashcard-container">
                  <div class="flashcard">
                    <div class="flashcard-inner">
                      <div class="flashcard-front">${renderContent(front)}</div>
                      <div class="flashcard-back">${renderContent(back)}</div>
                    </div>
                  </div>
                  <button class="flashcard-flip">翻转</button>
                </div>
              `
              node.type = 'html'
              node.value = htmlContent
            }
          })
        },
      ]
    },
  }
}

export default Flashcard