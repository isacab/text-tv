package com.vonlegohufvud.texttvsv.shared;

public abstract class RunnableWithArg implements Runnable {

  public Object arg;

  public RunnableWithArg(Object arg) {
    this.arg = arg;
  }

}
