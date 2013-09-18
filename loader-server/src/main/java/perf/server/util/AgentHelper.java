package perf.server.util;

import org.apache.log4j.Logger;
import perf.server.cache.AgentsCache;
import perf.server.client.LoaderAgentClient;
import perf.server.config.AgentConfig;
import perf.server.config.LoaderServerConfiguration;
import perf.server.domain.LoaderAgent;

import java.io.IOException;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: nitinka
 * Date: 18/9/13
 * Time: 10:56 AM
 * To change this template use File | Settings | File Templates.
 */
public class AgentHelper {
    private static Logger log = Logger.getLogger(AgentHelper.class);
    private static AgentConfig agentConfig = LoaderServerConfiguration.instance().getAgentConfig();
    public static void refreshAgentInfo(LoaderAgent loaderAgent) throws IOException {
        try {
            Map<String, Object> agentRegistrationParams = new LoaderAgentClient(loaderAgent.getIp(),
                    agentConfig.getAgentPort()).registrationInfo();
            loaderAgent.setAttributes(agentRegistrationParams);
        } catch (Exception e) {
            loaderAgent.setNotReachable();
            log.error(e);
        }
        try {
            AgentsCache.addAgent(loaderAgent);
        } catch (IOException e) {
            log.error(e);
        }
    }

}