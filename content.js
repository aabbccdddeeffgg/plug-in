// 页面加载完成后执行
window.onload = function() {
  // 获取文章标题
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    const articleTitle = titleElement.innerText.trim(); // 获取文章标题
    // 使用 chrome.runtime.getURL() 方法将图片转为可访问的 URL
    const str = `image/${articleTitle}.jpg`;
    const imgUrl = chrome.runtime.getURL(str);

    // 检查文件是否存在
    async function checkFileExists(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        return false;
      }
    }

    checkFileExists(imgUrl)
      .then(exists => {
        if (exists) {
          // 文件存在，创建一个 img 标签并插入到标题下方
          const imgElement = document.createElement('img');
          imgElement.src = imgUrl;
          imgElement.style.width = "100%"; // 设置图片宽度为100%
          titleElement.parentNode.insertBefore(imgElement, titleElement.nextSibling); // 将图片插入到标题下方
        } else {
          console.log('该文章对应的图片不存在');
        }
      })
      .catch(error => {
        console.log('文章不存在');
      });
  } else {
    console.log('文章标题未找到');
  }
};
  