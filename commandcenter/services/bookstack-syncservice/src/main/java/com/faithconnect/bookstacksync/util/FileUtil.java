package com.faithconnect.bookstacksync.util;

import java.io.*;
import java.net.URL;

public class FileUtil {

    /**
     * Gets the content of a file from a URL as a string
     */
    public String getSourceFile(String urlString) throws IOException {
        URL url = new URL(urlString);
        StringBuilder content = new StringBuilder();
        try (BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream()))) {
            String line;
            while ((line = in.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        return content.toString();
    }
    
    /**
     * Downloads binary data from a URL
     */
    public byte[] downloadFile(String urlString) throws IOException {
        URL url = new URL(urlString);
        try (InputStream in = url.openStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
            return out.toByteArray();
        }
    }
}
