// JSEnumerator 0.0.0 Copyright (c) 2008 KAYAC Inc. ( http://www.kayac.com/ )
// http://coderepos.org/share/wiki/JSEnumerator
function Enumerator(a){
return(arguments.length>1)? new Enumerator().initWithArray(arguments):
(this instanceof Enumerator)? this.init(a):new Enumerator(a);}
Enumerator.prototype={
init:function(){
if(arguments.length==0){
this.initWithArray([]);}else{
if(arguments[0] && arguments[0].length){
this.initWithArray(arguments[0]);}else
if(typeof arguments[0]=="function"){
this.initWithFunction(arguments[0]);}else
if(typeof arguments[0]=="object"){
if(arguments[0] instanceof Enumerator){
return arguments[0];}else{
this.initWithHash(arguments[0]);}
}else{
this.initWithArray([arguments[0]]);}
}
},
initWithFunction:function(fun){
this.next=fun;return this;},
initWithArray:function(array){
this.array=array;this.pos=0;this.initWithFunction(function(){
if(this.pos<array.length){
return array[this.pos++];}else{
throw Enumerator.StopIteration;}
});return this;},
initWithHash:function(hash){
var arr=[];for(var k in hash)if(hash.hasOwnProperty(k)){
arr.push([k,hash[k]]);}
this.initWithArray(arr);return this;},
toArray:function(){
return this.map(function(x){return x});},
cycle:function(){
var self=this,cache=[];return Enumerator(function(){
try{
var i=self.next();cache.push(i);return i;}catch(e){
if(e !=Enumerator.StopIteration)throw e;var i=-1;this.next=function(){return cache[++i % cache.length]};return this.next();}
});},
map:function(fun){
var ret=[];try{
if(this.array){
var a=this.array,c=this.pos,len=a.length-c,i=len % 8,type=(fun.length>1)? "apply":"call";if(i>0)do{
ret.push(fun[type](this,a[c++]));}while(--i);i=parseInt(len>>3);if(i>0)do{
ret.push(
fun[type](this,a[c++]),fun[type](this,a[c++]),
fun[type](this,a[c++]),fun[type](this,a[c++]),
fun[type](this,a[c++]),fun[type](this,a[c++]),
fun[type](this,a[c++]),fun[type](this,a[c++])
);}while(--i);this.pos=c;}else{
while(1)ret.push(fun[fun.length>1 ? "apply":"call"](this,this.next()));}
}catch(e){
if(e !=Enumerator.StopIteration)throw e;}
return ret;},
imap:function(fun){
var self=this;return Enumerator(function(){
return fun[fun.length>1 ? "apply":"call"](this,self.next());});},
izip:function(){
var eles=[this];eles.push.apply(eles,Enumerator(arguments).map(function(i){
return Enumerator(i);}));return Enumerator(function(){
var args=[];for(var i=0;i<eles.length;i++)args.push(eles[i].next());return args;});},
iselect:function(fun){
var self=this;return Enumerator(function(){
do{
var val=self.next();}while(!fun[fun.length>1 ? "apply":"call"](this,val));return val;});},
find:function(fun){
do{
var ret=this.next();}while(!fun[fun.length>1 ? "apply":"call"](this,ret));return ret;},
reduce:function(fun,init){
var self=this;var rval=(typeof init=="undefined")? self.next():init;this.each(function(i){rval=fun.call(this,rval,i)});return rval;},
max:function(fun){
if(!fun)fun=function(a,b){return a-b};var t=this.toArray().sort(fun)
return t[t.length-1];},
min:function(fun){
if(!fun)fun=function(a,b){return a-b};var t=this.toArray().sort(fun)
return t[0];},
chain:function(enums){
var f=this,a=Enumerator(arguments).imap(function(i){
return Enumerator(i);});return Enumerator(function(){
try{
return f.next();}catch(e){
if(e !=Enumerator.StopIteration)throw e;f=a.next();return f.next();}
});},
itake:function(a){
var self=this;if(typeof(a)=="number"){
var i=0;return Enumerator(function(){
if(i++<a)
return self.next();else
throw Enumerator.StopIteration;});}else
if(typeof(a)=="function"){
return Enumerator(function(){
var ret=self.next();if(a[a.length>1 ? "apply":"call"](this,ret))
return ret;else
throw Enumerator.StopIteration;});}
},
take:function(a){
return this.itake(a).toArray();},
idrop:function(a){
var self=this,i;if(typeof(a)=="number"){
for(i=0;i<a;i++)this.next();return this;}else
if(typeof(a)=="function"){
while(a[a.length>1 ? "apply":"call"](this,i=this.next()))true;return Enumerator(function(){
this.next=self.next;return i;});}
},
drop:function(a){
return this.idrop(a).toArray();},
every:function(fun){
try{
while(!(fun[fun.length>1 ? "apply":"call"](this,this.next())===false))1;return false;}catch(e){
if(e !=Enumerator.StopIteration)throw e;return true;}
},
some:function(fun){
try{
while(!(fun[fun.length>1 ? "apply":"call"](this,this.next())===true))1;return true;}catch(e){
if(e !=Enumerator.StopIteration)throw e;return false;}
},
withIndex:function(start){
return this.izip(E(start || 0).countup());},
countup:function(){
var start=this.next()|| 0;return Enumerator(function(){return start++});},
stop:function(){
throw Enumerator.StopIteration;}
};Enumerator.prototype.to_a=Enumerator.prototype.toArray;Enumerator.prototype.each=Enumerator.prototype.map;Enumerator.prototype.inject=Enumerator.prototype.reduce;Enumerator.prototype.ifilter=Enumerator.prototype.iselect;Enumerator.StopIteration=new Error("StopIteration");
