package com.open.perf.operation;

import com.open.perf.core.FunctionContext;
import com.open.perf.function.FunctionParameter;
import com.open.perf.function.PerformanceFunction;

import java.util.LinkedHashMap;
import java.util.List;

/**
 * Can be used to introduce Delay in the Group
 */
public class MathAddFunction extends PerformanceFunction {
    public static final String IP_NUM_JSON_LIST = "Number Json List";

    @Override
    public void init(FunctionContext context) {
        logger.info("Init");
    }

    @Override
    public void execute(FunctionContext context) throws Exception {
        List numList = context.getParameterAsList(IP_NUM_JSON_LIST);
        double  sum = 0.0;
        for(Object num : numList) {
            sum += Double.parseDouble(num.toString());
        }
        logger.info("Sum of "+numList +" : "+sum);
    }

    @Override
    public LinkedHashMap<String, FunctionParameter> inputParameters() {
        LinkedHashMap<String, FunctionParameter> parameters = new LinkedHashMap<String, FunctionParameter>();
        parameters.put(IP_NUM_JSON_LIST, new FunctionParameter().
                setName(IP_NUM_JSON_LIST).
                setDefaultValue(1).
                setMandatory(true).
                setDescription("List of numbers as json list"));
        return parameters;
    }
}
