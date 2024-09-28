window.onload = function () {
    const MAX_NODES = 7; // 最大节点数量
    const searchInput = document.getElementById("txt_search"); // 获取 id 为 txt_search 的输入框
    const searchButtons1 = document.getElementsByClassName("search-btn"); // 获取类名为 search-btn 的搜索按钮
    const searchButton1 = searchButtons1[0];
    const searchButtons2 = document.getElementsByClassName("btn-result-search"); // 获取类名为 btn-result-search 的"结果中搜索"按钮
    const searchButton2 = searchButtons2[0];
    const ModuleSearch = document.getElementById("ModuleSearch");
    const secondChild = ModuleSearch.children[1];
    
    // 在首页搜索的内容插入
    handleSearch();
    
    // 监听用户输入
    if (searchInput && searchButton1 && searchButton2) { // 确保元素存在
      searchInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          handleSearch();
        }
      });
  
      searchButton1.addEventListener('click', handleSearch);
      searchButton2.addEventListener('click', handleSearch);
    }
  
    // 从存储中获取节点数据并绘制图形
    chrome.storage.local.get(['nodes'], function (result) {
      const nodes = result.nodes || [];
      createPicture(nodes);
    });
    
  
    function createPicture(nodes) {
      // 如果SVG已经存在，移除它以便重新绘制
      d3.select("#d3-container").remove();
      // 插入svg到搜索框下方
      if(ModuleSearch) {
        const newdiv = document.createElement('div');
        newdiv.id = "d3-container";
        newdiv.style.display = "flex";
        newdiv.style.alignItems = "center";
        newdiv.style.justifyContent = "center";
        ModuleSearch.insertBefore(newdiv, secondChild);
      }
      
      // 创建SVG容器
      const svg = d3.select("#d3-container")
        .append("svg")
        .attr("width", 600)
        .attr("height", 400)
        .style("background-color", "white");
  
      // 创建边的数据，连接所有节点
      const links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          links.push({ source: i, target: j });
        }
      }
  
      // 定义力学仿真
      const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(300, 200))
        .force("link", d3.forceLink(links).distance(100))
        .on("tick", ticked);
  
      // 绘制边
      const link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2);
  
      // 绘制节点
      const node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .attr("fill", "#69b3a2")
        .call(drag(simulation));
  
      // 添加节点标签
      const labels = svg.selectAll(".text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .text(d => d.name);
  
      // 更新节点和边的位置
      function ticked() {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
  
        labels
          .attr("x", d => d.x + 12)
          .attr("y", d => d.y);
      }
  
      
      // 拖拽功能
      function drag(simulation) {
        return d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          });
      }
    }
  
    
    // 处理搜索逻辑的函数
    function handleSearch() {
      const userInput = searchInput.value.trim();
      if (!userInput) return; // 如果输入为空，则直接返回
    
      // 从存储中获取当前节点数据
      chrome.storage.local.get(['nodes'], function (result) {
        let nodes = result.nodes || [];
    
        // 检查 userInput 是否已存在于 nodes 中
        const isDuplicate = nodes.some(node => node.name === userInput);
        if (isDuplicate) return; // 如果已存在，则不进行任何操作
    
        // 如果节点数已达最大值，删除最早的节点
        if (nodes.length >= MAX_NODES) {
          nodes.shift();
        }
    
        // 添加新节点
        nodes.push({ name: userInput });
    
        // 更新存储中的节点数据
        chrome.storage.local.set({ nodes }, function () {
          // 重新绘制图形
          createPicture(nodes);
        });
      });
    }
    
};
  