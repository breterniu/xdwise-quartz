import { QuartzEmitterPlugin } from "../types"
import { FilePath, ServerSlug } from "../../util/path"
import fs from "fs"
import path from "path"

const flashcardCSS = `
.flashcard-container {
    max-width: 600px;
    margin: 40px auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .flashcard {
    perspective: 1000px;
    width: 100%;
    height: 300px;
  }
  .flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
  }
  .flashcard-front, .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center; /* 垂直居中 */
   // align-items: center; /* 水平居中 */
    border: 1px solid #ddd;
    border-radius: 15px;
    padding: 20px;
    box-sizing: border-box;
    background-color: white;
    font-size: 18px;
    line-height: 1.6;
    overflow-y: auto;
    white-space: pre-wrap; /* 支持换行 */
    word-wrap: break-word; /* 长单词换行 */
  }
  .flashcard-back {
    transform: rotateY(180deg);
  }
  .flashcard-flip {
    display: block;
    width: 120px;
    margin: 20px auto 0;
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    font-size: 16px;
  }
  .flashcard-flip:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
  .flashcard-content {
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
    white-space: pre-wrap;
  word-wrap: break-word;
  }
  .flashcard-content .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100%;
    padding: 5px 0;
  }
  .flashcard-content .katex {
    white-space: nowrap;
  }
  .flashcard-content .katex-html {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .flashcard-content img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 10px auto;
  }
`

const flashcardJS = `
(function() {
  // 主初始化函数
  function initFlashcards() {
    console.log('Initializing flashcards...'); // 调试日志

    document.querySelectorAll('.flashcard-container:not(.initialized)').forEach(function(container) {
      try {
        const flipButton = container.querySelector('.flashcard-flip');
        const flashcard = container.querySelector('.flashcard-inner');
        
        if (!flipButton || !flashcard) {
          console.warn('Required elements not found in container:', container);
          return;
        }

        // 移除旧的事件监听器
        flipButton.replaceWith(flipButton.cloneNode(true));
        const newFlipButton = container.querySelector('.flashcard-flip');
        
        // 添加新的事件监听器
        newFlipButton.addEventListener('click', function() {
          flashcard.style.transform = flashcard.style.transform === 'rotateY(180deg)' 
            ? 'rotateY(0deg)' 
            : 'rotateY(180deg)';
        });

        container.classList.add('initialized');
        console.log('Container initialized:', container); // 调试日志
      } catch (error) {
        console.error('Error initializing container:', error);
      }
    });
  }

  // 确保脚本加载完成后执行
  function ensureInitialization() {
    // 检查 DOM 是否已加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFlashcards);
    } else {
      initFlashcards();
    }

    // 监听动态内容变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          requestAnimationFrame(() => {
            initFlashcards();
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 监听 Quartz 特定事件
    document.addEventListener('quartz-content-updated', () => {
      console.log('Quartz content updated event received'); // 调试日志
      requestAnimationFrame(initFlashcards);
    });

    // 添加到 window 对象，以便外部访问
    window.reinitFlashcards = initFlashcards;
  }

  // 立即执行初始化
  ensureInitialization();
})();
`

export const FlashcardResources: QuartzEmitterPlugin = () => {
  return {
    name: "FlashcardResources",
    getQuartzComponents() {
      return []
    },
    async emit({ ctx, content, emit }): Promise<FilePath[]> {
      const fps: FilePath[] = []
      const staticDir = path.join("public", "static")

      // 确保目录存在
      fs.mkdirSync(path.join(staticDir, "styles"), { recursive: true })
      fs.mkdirSync(path.join(staticDir, "scripts"), { recursive: true })

      // 写入 CSS 文件
      const cssPath = path.join(staticDir, "styles", "flashcard.css")
      fs.writeFileSync(cssPath, flashcardCSS)
      fps.push(cssPath as FilePath)

      // 写入 JavaScript 文件，添加时间戳防止缓存
      const jsContent = `/* Version: ${Date.now()} */\n${flashcardJS}`
      const jsPath = path.join(staticDir, "scripts", "flashcard.js")
      fs.writeFileSync(jsPath, jsContent)
      fps.push(jsPath as FilePath)

      return fps
    },
  }
}

export default FlashcardResources
