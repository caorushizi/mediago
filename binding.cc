#include <assert.h>
#include <node_api.h>
#include <stdio.h>
#include <string>
#include "test.h"


using namespace std;

napi_value Add(napi_env env, napi_callback_info info) {
	napi_status status;

	size_t argc = 2;
	napi_value args[2];
	status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
	assert(status == napi_ok);

	if (argc < 2) {
		napi_throw_type_error(env, nullptr, "Wrong number of arguments");
		return nullptr;
	}

	napi_valuetype valuetype0;
	status = napi_typeof(env, args[0], &valuetype0);
	assert(status == napi_ok);

	napi_valuetype valuetype1;
	status = napi_typeof(env, args[1], &valuetype1);
	assert(status == napi_ok);

	if (valuetype0 != napi_string || valuetype1 != napi_string) {
		napi_throw_type_error(env, nullptr, "Wrong arguments");
		return nullptr;
	}

	char value0;
	size_t value0_size = 0;
	status = napi_get_value_string_utf8(env, args[0], &value0, value0_size, &value0_size);
	assert(status == napi_ok);

	char value1;
	size_t value1_size = 0;
	status = napi_get_value_string_utf8(env, args[1], &value1, value1_size, &value1_size);
	assert(status == napi_ok);

	

	size_t total_length = value0_size + value1_size;

	napi_value sum;
	char str3;
	strcpy(&str3, &value0);
	strcat(&str3, &value1);
	status = napi_create_string_utf8(env, &str3, value0_size + value1_size, &sum);
	assert(status == napi_ok);

	return sum;
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