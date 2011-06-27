#include <v8.h>
#include <node.h>
#include <node_events.h>

#include <stdlib.h>
#include <errno.h>

#include <freeradius-client.h>

using namespace node;
using namespace v8;

#define REQ_FUN_ARG(I, VAR)                                             \
  if (args.Length() <= (I) || !args[I]->IsFunction())                   \
    return ThrowException(Exception::TypeError(                         \
                  String::New("Argument " #I " must be a function")));  \
  Local<Function> VAR = Local<Function>::Cast(args[I]);

#define THROW(msg) \
  return ThrowException(Exception::Error(String::New(msg)));

#define GETOBJ(r) \
  Radius * r = ObjectWrap::Unwrap<Radius>(args.This());

#define ENFORCE_ARG_LENGTH(n, m)                   \
  if (args.Length() < n) THROW(m);
  
#define ENFORCE_ARG_STR(n)                      \
  if (!args[n]->IsString()) THROW("Argument must be string");

#define ENFORCE_ARG_NUMBER(n)                      \
  if (!args[n]->IsNumber()) THROW("Argument must be numeric");

#define ENFORCE_ARG_FUNC(n)                      \
  if (!args[n]->IsFunction()) THROW("Argument must be a function");


class Radius: ObjectWrap
{
private:
  rc_handle	*rh;
  VALUE_PAIR 	*send, *received;
  char 		msg[4096];
  bool          busy;

  struct RadiusRequest {
    Radius * r;
    Persistent<Function> callback;
    int result;
  };

public:
  static Persistent<FunctionTemplate> s_ct;

  static void Init(Handle<Object> target)
  {
    HandleScope scope;
    Local<FunctionTemplate> ft = FunctionTemplate::New(New);

    s_ct = Persistent<FunctionTemplate>::New(ft);
    s_ct->InstanceTemplate()->SetInternalFieldCount(1);
    s_ct->SetClassName(String::NewSymbol("Radius"));

    NODE_SET_PROTOTYPE_METHOD(s_ct, "initRadius", InitRadius);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "avpairAdd", AvpairAdd);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "configAdd", ConfigAdd);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "readDictionary", ReadDictionary);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "auth", Auth);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "acct", Acct);
    NODE_SET_PROTOTYPE_METHOD(s_ct, "busy", Busy);

    target->Set(String::NewSymbol("Radius"), s_ct->GetFunction());
  }

  static Handle<Value> New(const Arguments& args)
  {
    HandleScope scope;
    Radius * r = new Radius();
    r->Wrap(args.This());

    return args.This();
  }

  static Handle<Value> InitRadius(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);
    
    r->send = NULL;
    r->busy = 0;

    r->rh = rc_new();
    r->rh = rc_config_init(r->rh);

    return scope.Close(Integer::New(0));
  }

  static Handle<Value> Busy(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);

    return scope.Close(Integer::New(r->busy));
  }

  static Handle<Value> ReadDictionary(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);

    if (rc_read_dictionary(r->rh, rc_conf_str(r->rh, (char *)"dictionary")) != 0) {
      THROW("Could not read dictionary");
    }

    return scope.Close(Integer::New(0));    
  }


  static Handle<Value> ConfigAdd(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);

    ENFORCE_ARG_LENGTH(2, "Must provide a key and value");
    ENFORCE_ARG_STR(0);
    ENFORCE_ARG_STR(1);

    String::Utf8Value key(args[0]);
    String::Utf8Value val(args[1]);

    if (rc_add_config(r->rh, *key, *val, "config", 0) != 0) {
      fprintf(stderr, "Opt: %s %s\n", *key, *val);
      THROW("Bad config option");
    }
    
    return scope.Close(Integer::New(0));    
  }

  static Handle<Value> AvpairAdd(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);
    DICT_ATTR * da;
    int res;

    ENFORCE_ARG_LENGTH(2, "Must provide a type and value");

    String::Utf8Value attr(args[0]);

    da = rc_dict_findattr(r->rh, *attr);

    if (da) {
      switch (da->type) {
      case PW_TYPE_STRING:
        {
          String::Utf8Value str(args[1]);
          res = (rc_avpair_add(r->rh, &(r->send), da->value, *str, -1, 0) == NULL ? 1 : 0);
          break;
        }
      case PW_TYPE_INTEGER:
        {
          if (args[1]->IsString()) {
            // look for the value in the dictionary
            DICT_VALUE * dv;
            String::Utf8Value str_rep(args[1]);
            dv = rc_dict_findval(r->rh, *str_rep);
            if (dv == NULL) {
              THROW("Unknown value. Check dictionary");
            }
            res = (rc_avpair_add(r->rh, &(r->send), da->value, &(dv->value), -1, 0) == NULL ? 1 : 0);            
          } else {
            uint32_t val(args[1]->Uint32Value());            
            res = (rc_avpair_add(r->rh, &(r->send), da->value, &val, -1, 0) == NULL ? 1 : 0);
          }
          break;
        }
      case PW_TYPE_IPADDR:
        {
          String::Utf8Value str(args[1]);
          uint32_t val = rc_get_ipaddr(*str);
          res = (rc_avpair_add(r->rh, &(r->send), da->value, &val, -1, 0) == NULL ? 1 : 0);
          break;
        }
      default:
        THROW("Unknown Type. Check Dictionary");
      }
      if (res) {
        THROW("Unable to add attribute");
      } 
      return scope.Close(Integer::New(0));
    } 

    THROW("Unknown Attribute Name");
  }

  /*
   * Auth Routines
   *
   */
  static Handle<Value> Auth(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);
    struct RadiusRequest * rad_req;

    ENFORCE_ARG_LENGTH(1, "Must provide a callback");
    ENFORCE_ARG_FUNC(0);

    REQ_FUN_ARG(0, cb);
    
    rad_req = (Radius::RadiusRequest*)malloc(sizeof(struct RadiusRequest));
    r->Ref(); // don't collect!
    rad_req->r = r;
    rad_req->callback = Persistent<Function>::New(cb);

    r->busy = 1;
    eio_custom(EIO_Auth, EIO_PRI_DEFAULT, EIO_AfterAuth, rad_req);
    ev_ref(EV_DEFAULT_UC); //don't quit while we're working!
    
    return scope.Close(Integer::New(0));
  }

  static int EIO_Auth(eio_req * req) {
    struct RadiusRequest * rad_req = (Radius::RadiusRequest*)req->data;
    Radius * r = rad_req->r;

    rad_req->result = rc_auth(r->rh, 0, r->send, &(r->received), r->msg);
 
    return 0;
  }

  static int EIO_AfterAuth(eio_req * req) {
    struct RadiusRequest * rad_req = (Radius::RadiusRequest*)req->data;
    Radius * r = rad_req->r;
    ev_unref(EV_DEFAULT_UC); //now we're done we can unref
    r->Unref(); // don't keep this any longer than this scope
    
    Local<Value> argv[1];
    Local<Array>  js_result_list;
    Local<Object> av_pair_info;
    VALUE_PAIR *vp = NULL;
    char kbuf[1024], vbuf[1024];
    int count = 0;

    TryCatch try_catch;

    argv[0] = Integer::New(rad_req->result);
    
    if (r->received) {
      //count AV pairs and start Array.
      vp = r->received;
      while(vp){
        count++;
        vp = vp->next;
      }
      js_result_list = Array::New(++count);
      count = 0;

      vp = r->received;
      while(vp) {
        if(rc_avpair_tostr(r->rh, vp, kbuf, 1024, vbuf, 1024) == 0){
	    av_pair_info = Array::New(2);
	    av_pair_info->Set(0, String::New(kbuf));
	    av_pair_info->Set(1, String::New(vbuf));
	    js_result_list->Set(count++, av_pair_info);
        }
        vp = vp->next;
      } 
    }else{
	//attributes are an empty array.
	js_result_list = Array::New();
    }

    argv[1] = js_result_list;
    rad_req->callback->Call(Context::GetCurrent()->Global(), 2, argv);

    rad_req->callback.Dispose();

    if (try_catch.HasCaught()) {
      FatalException(try_catch);
    }

    free(rad_req);

    r->busy = 0;

    return 0;
  }

  /*
   * Acct Routines
   * 
   */
  static Handle<Value> Acct(const Arguments& args)
  {
    HandleScope scope;
    GETOBJ(r);
    struct RadiusRequest * rad_req;

    ENFORCE_ARG_LENGTH(1, "Must provide a callback");
    ENFORCE_ARG_FUNC(0);

    REQ_FUN_ARG(0, cb);
    
    rad_req = (Radius::RadiusRequest*)malloc(sizeof(struct RadiusRequest));
    r->Ref(); // don't collect!
    rad_req->r = r;
    rad_req->callback = Persistent<Function>::New(cb);

    r->busy = 1;
    eio_custom(EIO_Acct, EIO_PRI_DEFAULT, EIO_AfterAcct, rad_req);
    ev_ref(EV_DEFAULT_UC); //don't quit while we're working!
    
    return scope.Close(Integer::New(0));
  }

  static int EIO_Acct(eio_req * req) {
    struct RadiusRequest * rad_req = (Radius::RadiusRequest*)req->data;
    Radius * r = rad_req->r;

    rad_req->result = rc_acct(r->rh, 0, r->send);
 
    return 0;
  }

  static int EIO_AfterAcct(eio_req * req) {
    struct RadiusRequest * rad_req = (Radius::RadiusRequest*)req->data;
    Radius * r = rad_req->r;
    ev_unref(EV_DEFAULT_UC); //now we're done we can unref
    r->Unref(); // don't keep this any longer than this scope
    
    Local<Value> argv[1];

    TryCatch try_catch;

    argv[0] = Integer::New(rad_req->result);
    rad_req->callback->Call(Context::GetCurrent()->Global(), 1, argv);

    rad_req->callback.Dispose();

    if (try_catch.HasCaught()) {
      FatalException(try_catch);
    }

    if (r->send != NULL) {
      rc_avpair_free(r->send);
      r->send = NULL;
    }
    free(rad_req);

    r->busy = 0;

    return 0;
  }
};

Persistent<FunctionTemplate> Radius::s_ct;

extern "C" void
init(Handle<Object> target) {
  Radius::Init(target);
}
