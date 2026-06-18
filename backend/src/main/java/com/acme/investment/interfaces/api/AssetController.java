package com.acme.investment.interfaces.api;

import com.acme.investment.application.asset.AssetService;
import com.acme.investment.domain.asset.Asset;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {
    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public List<Asset> search(@RequestParam(required = false) String query) {
        return assetService.search(query);
    }
}
