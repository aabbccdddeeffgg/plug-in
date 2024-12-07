import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.By;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;  // 使用 EdgeOptions
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.time.Duration;
import java.util.List;

public class CNKIWebScraper {
    public static void openPage(WebDriver driver, String theme) {
        // 打开网页
        driver.get("https://kns.cnki.net/kns8/AdvSearch");

        // 确保 WebDriver 被正确初始化，只需在 main 方法中调用一次
        System.out.println("Edge WebDriver is being initialized...");

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(100));

        // 查找并输入主题
        WebElement searchBox = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//*[@id='txt_SearchText']")));
        searchBox.sendKeys(theme);

        // 点击搜索按钮
        WebElement searchButton = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("/html/body/div[2]/div[2]/div/div[1]/input[2]")));
        searchButton.click();

        // 点击第一个结果
        WebElement firstResultLink = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("/html/body/div[3]/div[1]/div/div/div/a[1]")));
        firstResultLink.click();

        // 获取总结果数和页数
        WebElement resultsNumberElement = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("/html/body/div[3]/div[2]/div[2]/div[2]/form/div/div[1]/div[1]/span[1]/em")));
        String resultsText = resultsNumberElement.getText().replace(",", "");
        int totalResults = Integer.parseInt(resultsText);
        int totalPages = totalResults / 20 + 1;

        System.out.println("共找到 " + totalResults + " 条结果, " + totalPages + " 页。");
    }

    public static void crawl(WebDriver driver, int papersNeed, String theme) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        int count = 1;

        while (count <= papersNeed) {
            try {
                List<WebElement> titleList = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.className("fz14")));
                for (int i = 0; i < titleList.size(); i++) {
                    if (count > papersNeed) break;

                    String titleXPath = String.format("/html/body/div[3]/div[2]/div[2]/div[2]/form/div/table/tbody/tr[%d]/td[2]", i + 1);
                    String authorXPath = String.format("/html/body/div[3]/div[2]/div[2]/div[2]/form/div/table/tbody/tr[%d]/td[3]", i + 1);

                    WebElement titleElement = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(titleXPath)));
                    WebElement authorElement = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath(authorXPath)));

                    System.out.println(count + "\t" + titleElement.getText() + "\t" + authorElement.getText());
                    count++;
                }
                WebElement nextPageButton = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("PageNext")));
                nextPageButton.click();
            } catch (Exception e) {
                System.out.println("爬取失败: " + e.getMessage());
                break;
            }
        }
    }

    public static void main(String[] args) {
        // 设置 WebDriver 的路径
        System.setProperty("webdriver.edge.driver", "E:\\chrome\\edgedriver_win64\\msedgedriver.exe");

        // 初始化 EdgeOptions
        EdgeOptions options = new EdgeOptions();
        options.addArguments("--disable-images");  // 禁用图片加载

        // 使用 EdgeDriver 初始化 WebDriver
        WebDriver driver = new EdgeDriver(options);

        // 确定搜索主题和需要的论文数量
        String theme = "python";
        int papersNeed = 100;

        // 调用爬取功能
        openPage(driver, theme);
        crawl(driver, papersNeed, theme);

        // 退出浏览器
        driver.quit();
    }
}
