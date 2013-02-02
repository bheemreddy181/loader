package loader.monitor.collector;

import loader.monitor.cache.ResourceCache;
import loader.monitor.config.OnDemandCollectorConfig;
import org.apache.log4j.Logger;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: nitinka
 * Date: 4/1/13
 * Time: 12:35 PM
 * To change this template use File | Settings | File Templates.
 */
public class CollectorThread extends Thread{
    private boolean keepRunning = true;
    private Map<String,BaseCollector> collectors;
    private Map<String,Long> collectorLastExecutionTimeMap;
    private static final Logger log = Logger.getLogger(CollectorThread.class);
    private int interval;

    public CollectorThread(int interval) throws ClassNotFoundException,
            InvocationTargetException,
            NoSuchMethodException,
            IllegalAccessException,
            InstantiationException {

        this.collectors = new HashMap<String, BaseCollector>();
        this.collectorLastExecutionTimeMap = new HashMap<String, Long>();
        this.interval = interval;
    }

    public void run() {
        log.info("Starting Collector Thread");

        while(keepRunning) {

            for(String collectorName : this.collectors.keySet()) {
                BaseCollector collector = this.collectors.get(collectorName);
                if(canCollectorRun(collector)) {
                    try {
                        // Collect Metrics
                        ResourceCollectionInstance instanceResource = collector.collect0();

                        // Keep in Cache
                        ResourceCache.addStats(instanceResource);
                        this.collectorLastExecutionTimeMap.put(collectorName, System.currentTimeMillis());
                    } catch (Exception e) {
                        e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
                    }
                }
            }

            try {
                sleep(this.interval);
            } catch (InterruptedException e) {
                e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
            }
        }
    }

    private boolean canCollectorRun(BaseCollector collector) {
        Long lastExecutionTime =  this.collectorLastExecutionTimeMap.get(collector.getName());
        if(lastExecutionTime != null) {
            return (System.currentTimeMillis() - lastExecutionTime) > collector.getCollectionInterval();
        }
        return true;
    }

    public void startCollector(BaseCollector collector) {
        synchronized (this.collectors){
            this.collectors.put(collector.getName(), collector);
        };
    }

    public void stopCollector(BaseCollector collector) {
        synchronized (this.collectors){
            this.collectors.remove(collector.getName());
        };
    }
}
