#include <assert.h>
#include <node_api.h>
#include <stdio.h>
#include <string>
#include "./lib/mediago.h"

napi_value Add(napi_env env, napi_callback_info info) {
	napi_status status;

	size_t argc = 3;
	napi_value args[4];
	status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
	assert(status == napi_ok);

	if (argc != 3) {
		napi_throw_type_error(env, nullptr, "参数数量出错");
		return nullptr;
	}

	napi_valuetype valuetype0;
	status = napi_typeof(env, args[0], &valuetype0);
	assert(status == napi_ok);

	napi_valuetype valuetype1;
	status = napi_typeof(env, args[1], &valuetype1);
	assert(status == napi_ok);

	napi_valuetype valuetype2;
    status = napi_typeof(env, args[2], &valuetype2);
    assert(status == napi_ok);

	if (valuetype0 != napi_string || valuetype1 != napi_string || valuetype2 != napi_string) {
		napi_throw_type_error(env, nullptr, "参数类型出错");
		return nullptr;
	}

	char value0[1024];
	size_t value0_size = 0;
	status = napi_get_value_string_utf8(env, args[0], value0, 0, &value0_size);
	assert(status == napi_ok);

	GoString name;
    name.p = value0;
    name.n = int(value0_size);

	char value1[1024];
	size_t value1_size = 0;
	status = napi_get_value_string_utf8(env, args[1], value1, 0, &value1_size);
	assert(status == napi_ok);

	GoString path;
    path.p = value1;
    path.n = int(value1_size);

	char value2[1024];
    size_t value2_size = 0;
    status = napi_get_value_string_utf8(env, args[2], value2, 0, &value2_size);
    assert(status == napi_ok);

    GoString url;
    url.p = value2;
    url.n = int(value2_size);

    Start(name, path, url);

    napi_value test;
	status = napi_create_string_utf8(env, "完成", 6, &test);
	assert(status == napi_ok);

	return test;
}

#define DECLARE_NAPI_METHOD(name, func)                                        \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Init(napi_env env, napi_value exports) {
	napi_status status;
	napi_property_descriptor addDescriptor = DECLARE_NAPI_METHOD("add", Add);
	status = napi_define_properties(env, exports, 1, &addDescriptor);
	assert(status == napi_ok);
	return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)