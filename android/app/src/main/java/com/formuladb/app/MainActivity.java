package com.formuladb.app;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "StatusBarHeight")
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(StatusBarHeightPlugin.class);
    }
}

class StatusBarHeightPlugin extends Plugin {
    @PluginMethod
    public void getHeight(PluginCall call) {
        float heightPx = 0;
        float density = getContext().getResources().getDisplayMetrics().density;

        if (android.os.Build.VERSION.SDK_INT >= 30) {
            android.view.WindowInsets insets = getActivity().getWindowManager().getCurrentWindowMetrics().getWindowInsets();
            android.graphics.Insets statusBars = insets.getInsets(android.view.WindowInsets.Type.statusBars());
            heightPx = statusBars.top;
        } else {
            int resourceId = getContext().getResources().getIdentifier("status_bar_height", "dimen", "android");
            if (resourceId > 0) {
                heightPx = getContext().getResources().getDimensionPixelSize(resourceId);
            }
        }

        float heightDp = heightPx / density;
        JSObject result = new JSObject();
        result.put("height", heightDp);
        result.put("heightPx", heightPx);
        result.put("density", density);
        call.resolve(result);
    }
}
